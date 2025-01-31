import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MessageArgs } from './dto/message.args';
import { CreateMessageInput } from './dto/message.input';
import {
  DeliveredStatus,
  Message,
  MessagesData,
  PageInfo,
} from './models/message.model';
import { Message as MessageSchema, MessageDocument } from './message.schema';
import { ChatService } from '../chat/chat.service';
import { UserClientService } from '../userClient/userClient.service';
import { PubSubService } from '../shared/pubSub.service';

@Injectable()
export class MessageService {
  private REDIS_HOST: string;
  private REDIS_PORT: number;
  private redisConfig: RedisOptions;
  private redisClient: Redis;
  private redisSubscriber: Redis;
  private redisPublisher: Redis;

  constructor(
    @InjectModel(MessageSchema.name)
    private MessageModel: Model<MessageDocument>,
    private chatService: ChatService,
    private userClientService: UserClientService,
    private readonly pubSubService: PubSubService,
    private readonly configService: ConfigService,
  ) {
    this.REDIS_HOST = configService.get('REDIS_HOST');
    this.REDIS_PORT = configService.get('REDIS_PORT');
    this.redisConfig = {
      host: this.REDIS_HOST,
      port: this.REDIS_PORT,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };
    this.redisClient = new Redis(this.redisConfig);
    this.redisSubscriber = new Redis(this.redisConfig);
    this.redisPublisher = new Redis(this.redisConfig);
  }

  async groupPipeline(): Promise<any> {
    return [
      {
        $group: {
          _id: '$_id',
          chatId: { $first: '$chatId' },
          queueId: { $first: '$queueId' },
          isActive: { $first: '$isActive' },
          message: { $first: '$message' },
          sender: { $first: '$sender' },
          otherMembers: { $push: '$otherMembers' },
          timestamp: { $first: '$timestamp' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
    ];
  }

  async membersPipeline(): Promise<any> {
    return [
      {
        $unwind: '$otherMembers',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherMembers._id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                name: 1,
                picture: 1,
                email: 1,
                email_verified: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'userDetails',
        },
      },
      {
        $set: {
          otherMembers: {
            $mergeObjects: [
              '$otherMembers',
              { $arrayElemAt: ['$userDetails', 0] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender._id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                name: 1,
                picture: 1,
                email: 1,
                email_verified: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'senderDetails',
        },
      },
      {
        $set: {
          sender: {
            $mergeObjects: ['$sender', { $arrayElemAt: ['$senderDetails', 0] }],
          },
        },
      },
    ];
  }

  async findOneById(messageId: string): Promise<MessageDocument> {
    const messageObjectId = new ObjectId(messageId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const message = await this.MessageModel.aggregate([
      { $match: { _id: messageObjectId, isActive: true } },
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ])
      .cursor()
      .next();
    if (!message) {
      throw new BadRequestException('Message not found.');
    }
    return message;
  }

  async findAll(chatId: string, args: MessageArgs): Promise<MessagesData> {
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.chatService.findOneById(chatId);
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    const { limit, after } = args;
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const messages = await this.MessageModel.aggregate([
      {
        $match: {
          chatId: chatObjectId,
          ...(after ? { _id: { $lt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...membersPipeline,
      ...groupPipeline,
      { $sort: { timestamp: -1 } },
      { $limit: limit },
    ]);

    let edges: Message[] = [];
    let pageInfo: PageInfo = {
      endCursor: '',
      hasPreviousPage: false,
      hasNextPage: false,
    };

    if (messages?.length) {
      const oldestMessageIndex = messages?.length - 1;
      const oldestMessage = messages?.[oldestMessageIndex];
      const newestMessage = messages?.[0];
      const hasPreviousPage = await this.MessageModel.exists({
        chatId: chatObjectId,
        _id: { $gt: newestMessage?._id },
        isActive: true,
      }).then(Boolean);
      pageInfo = {
        endCursor: oldestMessage?._id?.toString(),
        hasPreviousPage,
        hasNextPage: messages?.length === limit,
      };
      edges = messages?.reverse();
    }

    return {
      edges,
      pageInfo,
      scrollPosition: 0,
      isFetched: true,
    };
  }

  async create(data: CreateMessageInput): Promise<MessageDocument> {
    const {
      userId,
      chatId,
      queueId,
      isQueued,
      queuedTimestamp,
      isSent,
      sentTimestamp,
      ...rest
    } = data;
    if (queueId) {
      const duplicateMessage = await this.MessageModel.findOne({
        queueId,
      }).lean();
      if (duplicateMessage) {
        throw new BadRequestException('Duplicate Message found.');
      }
    }
    const chat = await this.chatService.findOneById(chatId);
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    const chatObjectId = new ObjectId(chatId);
    const userObjectId = new ObjectId(userId);
    const { members } = chat;
    const otherMembers = members
      .filter((el) => String(el?._id) !== String(userId))
      .map((el) => ({
        _id: new ObjectId(el?._id),
      }));
    const newMessageData = {
      ...rest,
      chatId: chatObjectId,
      queueId,
      sender: {
        _id: userObjectId,
        queuedStatus: {
          isQueued,
          timestamp: queuedTimestamp,
        },
        sentStatus: {
          isSent,
          timestamp: sentTimestamp,
        },
      },
      otherMembers,
      timestamp: queuedTimestamp || sentTimestamp,
    };
    const newMessage = new this.MessageModel(newMessageData);
    const savedMessage = (await newMessage.save()).toObject();
    const { _id: messageId } = savedMessage;
    const message = await this.findOneById(String(messageId));
    return message;
  }

  async updateDeliveryStatus(
    messageId: string,
    otherMemberId: string,
    deliveredStatus: DeliveredStatus,
  ): Promise<MessageDocument> {
    const messageObjectId = new ObjectId(messageId);
    const OtherMemberObjectId = new ObjectId(otherMemberId);
    const { _id } = (await this.MessageModel.findOneAndUpdate(
      { _id: messageObjectId },
      {
        $set: {
          'otherMembers.$[element].deliveredStatus': deliveredStatus,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'element._id': OtherMemberObjectId }],
      },
    ).lean()) as MessageDocument;
    const message = await this.findOneById(String(_id));
    return message;
  }

  async deliverMessage(
    message: MessageDocument,
    chatId: string,
    isAlreadyDelivered?: boolean,
  ): Promise<void> {
    let isDelivered = !!isAlreadyDelivered;

    try {
      const { _id, otherMembers } = message || {};
      const messageId = String(_id);

      if (otherMembers?.length) {
        for (const member of otherMembers) {
          const userId = String(member?._id);

          const activeClientsData =
            await this.userClientService.findAllActiveInactive(userId, true);
          const inactiveClientsData =
            await this.userClientService.findAllActiveInactive(userId, false);

          const activeClients = activeClientsData?.clients;
          const inactiveClients = inactiveClientsData?.clients;

          if (activeClients?.length) {
            if (!isDelivered) {
              const deliveredStatus = {
                isDelivered: true,
                timestamp: Date.now(),
              };
              const updatedMessage = await this.updateDeliveryStatus(
                messageId,
                userId,
                deliveredStatus,
              );
              await this.pubSubService.pubSubInstance.publish(
                'OnMessageUpdated',
                {
                  OnMessageUpdated: {
                    message: updatedMessage,
                  },
                },
              );
              isDelivered = true;
            } else {
              await this.pubSubService.pubSubInstance.publish(
                'OnMessageUpdated',
                {
                  OnMessageUpdated: {
                    message,
                  },
                },
              );
            }
          }

          if (inactiveClients?.length) {
            for (const client of inactiveClients) {
              const sessionID = client?.sessionID;
              await this.addQueueAndJob(`session_${sessionID}_queue`, {
                messageId,
                isDelivered,
              });
              await this.addQueueAndJob(`user_${userId}_queue`, {
                messageId,
                isDelivered,
              });
            }
          }

          if (!activeClients?.length && !inactiveClients?.length) {
            await this.addQueueAndJob(`user_${userId}_queue`, {
              messageId,
              isDelivered,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }

    const updatedChat = await this.chatService.findOneById(chatId);
    await this.pubSubService.pubSubInstance.publish('OnChatUpdated', {
      OnChatUpdated: {
        chat: updatedChat,
      },
    });
  }

  async deliverQueuedMessage(job: Job): Promise<any> {
    const jobData = job?.data;
    const messageId = jobData?.messageId;
    const isDelivered = jobData?.isDelivered;
    const message = await this.findOneById(String(messageId));
    const { chatId } = message || {};
    await this.deliverMessage(message, String(chatId), isDelivered);
  }

  async addQueueAndJob(queueName: string, jobData: any): Promise<void> {
    const queue = new Queue(queueName, {
      connection: {
        host: this.REDIS_HOST,
        port: this.REDIS_PORT,
      },
    });

    try {
      const jobId = jobData?.messageId;
      if (jobId) {
        const existingJob = await queue.getJob(jobId);
        if (existingJob) {
          await queue.close();
          return;
        }
      }
      await queue.add('deliverMessage', jobData, {
        jobId,
        removeOnComplete: true,
      });
    } catch (err) {
      console.error(`Failed to add queue ${queueName}:`, err);
    } finally {
      await queue.close();
    }
  }

  async cleanupQueue(queueName: string): Promise<void> {
    try {
      const keys = [
        `bull:${queueName}:stalled-check`,
        `bull:${queueName}:meta`,
        `bull:${queueName}:events`,
        `bull:${queueName}:id`,
      ];
      await this.redisClient.del(...keys);
    } catch (err) {
      console.error(`Failed to delete keys for queue ${queueName}:`, err);
    }
  }

  async removeQueue(queueName: string): Promise<void> {
    try {
      const pattern = `bull:${queueName}:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys?.length === 0) return;
      await this.redisClient.del(...keys);
    } catch (err) {
      console.error(`Failed to delete keys for queue ${queueName}:`, err);
    }
  }

  async startWorker(queueName: string): Promise<void> {
    const worker = new Worker(
      queueName,
      async (job: Job) => {
        await this.deliverQueuedMessage(job);
      },
      {
        connection: {
          host: this.REDIS_HOST,
          port: this.REDIS_PORT,
        },
      },
    );

    const stopChannel = `worker-stop:${queueName}`;
    const handleStopMessage = async (channel: string, message: string) => {
      if (channel === stopChannel && message === 'stop') {
        try {
          // await worker.close();
          await this.cleanupQueue(queueName);
        } catch (error) {
          console.error(`Error stopping worker for queue ${queueName}:`, error);
        } finally {
          await this.redisSubscriber.unsubscribe(stopChannel);
          this.redisSubscriber.off('message', handleStopMessage);
        }
      }
    };

    this.redisSubscriber.on('message', handleStopMessage);
    await this.redisSubscriber.subscribe(stopChannel);
  }

  async stopWorker(queueName: string): Promise<void> {
    const stopChannel = `worker-stop:${queueName}`;
    try {
      await this.redisPublisher.publish(stopChannel, 'stop');
    } catch (error) {
      console.error(
        `Failed to publish stop signal for queue ${queueName}:`,
        error,
      );
    }
  }
}
