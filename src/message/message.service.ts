import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MessageArgs } from './dto/message.args';
import { CreateMessageInput } from './dto/message.input';
import { Message, MessagesData, PageInfo } from './models/message.model';
import { Message as MessageSchema, MessageDocument } from './message.schema';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(MessageSchema.name)
    private MessageModel: Model<MessageDocument>,
    private chatService: ChatService,
  ) {
    //
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

  async findOneById(messageId: string): Promise<Message> {
    const messageObjectId = new ObjectId(messageId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const message = await this.MessageModel.aggregate([
      { $match: { _id: messageObjectId, isActive: true } },
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ]);
    if (!message?.length) {
      throw new BadRequestException('Message not found.');
    }
    return message?.[0];
  }

  async create(data: CreateMessageInput): Promise<Message> {
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
    let lastMessage: Message;
    let pageInfo: PageInfo = {
      endCursor: '',
      hasNextPage: false,
    };

    if (messages?.length) {
      edges = messages?.reverse();
      lastMessage = messages[0];
      pageInfo = {
        endCursor: lastMessage?._id?.toString(),
        hasNextPage: messages?.length === limit,
      };
    }

    return {
      edges,
      pageInfo,
    };
  }

  async remove(messageId: string): Promise<boolean> {
    return true;
  }
}
