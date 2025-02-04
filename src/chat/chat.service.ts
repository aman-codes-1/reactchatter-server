import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ChatArgs } from './dto/chat.args';
import { CreateChatInput } from './dto/chat.input';
import { Chat as ChatSchema, ChatDocument } from './chat.schema';
import { Chat, CreateChatData } from './models/chat.model';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSchema.name)
    private ChatModel: Model<ChatDocument>,
  ) {
    //
  }

  membersPipeline(): PipelineStage[] {
    return [
      {
        $unwind: '$members',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members._id',
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
        $lookup: {
          from: 'messages',
          let: {
            chatId: '$_id',
            memberId: '$members._id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $eq: ['$chatId', '$$chatId'] },
                    { $in: ['$$memberId', '$receivers._id'] },
                    { $ne: ['$receivers.readStatus.isRead', true] },
                  ],
                },
              },
            },
            {
              $count: 'unreadMessagesCount',
            },
          ],
          as: 'unreadMessages',
        },
      },
      {
        $set: {
          members: {
            $mergeObjects: ['$members', { $arrayElemAt: ['$userDetails', 0] }],
          },
        },
      },
      {
        $set: {
          'members.unreadMessagesCount': {
            $ifNull: [
              { $arrayElemAt: ['$unreadMessages.unreadMessagesCount', 0] },
              0,
            ],
          },
        },
      },
    ];
  }

  lastMessagePipeline(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          pipeline: [
            { $match: { isActive: true } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage',
        },
      },
      {
        $unwind: {
          path: '$lastMessage',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  groupPipeline(): PipelineStage[] {
    return [
      {
        $group: {
          _id: '$_id',
          isActive: { $first: '$isActive' },
          type: { $first: '$type' },
          members: { $push: '$members' },
          friends: { $first: '$friends' },
          lastMessage: { $first: '$lastMessage' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
    ];
  }

  async findOneById(chatId: string): Promise<ChatDocument> {
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.ChatModel.aggregate([
      { $match: { _id: chatObjectId, isActive: true } },
      ...this.membersPipeline(),
      ...this.lastMessagePipeline(),
      ...this.groupPipeline(),
      { $limit: 1 },
    ])
      .cursor()
      .next();
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    return chat;
  }

  async findAll(userId: string, args: ChatArgs): Promise<ChatDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const chats = await this.ChatModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...this.membersPipeline(),
      ...this.lastMessagePipeline(),
      ...this.groupPipeline(),
      {
        $addFields: {
          sortField: {
            $cond: {
              if: {
                $gt: [{ $ifNull: ['$lastMessage.timestamp', null] }, null],
              },
              then: '$lastMessage.timestamp',
              else: { $toLong: '$createdAt' },
            },
          },
        },
      },
      {
        $sort: { sortField: -1 },
      },
      { $unset: 'sortField' },
      { $limit: limit },
    ]);
    return chats;
  }

  async create(data: CreateChatInput): Promise<CreateChatData> {
    const { userId, type, friendIds, friendUserIds } = data || {};
    let isAlreadyCreated = false;
    let chat: ChatDocument;
    if (type === 'private' && friendIds?.length === 1) {
      const Chat = await this.ChatModel.findOne({
        type: 'private',
        friends: {
          $size: 1,
          $elemMatch: { _id: new ObjectId(friendIds?.[0]) },
        },
      });
      if (Chat) {
        isAlreadyCreated = true;
        chat = Chat;
      }
    }
    if (!isAlreadyCreated) {
      const members = [userId, ...friendUserIds]?.map(
        (id: string, idx: number) => ({
          _id: new ObjectId(id),
          hasAdded: idx === 0,
        }),
      );
      const friends = friendIds?.map((id: string) => ({
        _id: new ObjectId(id),
      }));
      const newChat = new this.ChatModel({
        type,
        members,
        friends,
      });
      chat = (await newChat.save()).toObject();
    }

    const fullChat = (await this.findOneById(
      String(chat?._id),
    )) as unknown as Chat;
    return {
      isAlreadyCreated,
      chat: fullChat,
    };
  }
}
