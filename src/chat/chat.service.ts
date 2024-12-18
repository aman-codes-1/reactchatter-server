import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ChatArgs } from './dto/chat.args';
import { CreateChatInput } from './dto/chat.input';
import { Chat as ChatSchema, ChatDocument } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSchema.name)
    private ChatModel: Model<ChatDocument>,
  ) {
    //
  }

  async groupPipeline(): Promise<any> {
    return [
      {
        $group: {
          _id: '$_id',
          queueId: { $first: '$queueId' },
          isActive: { $first: '$isActive' },
          type: { $first: '$type' },
          members: { $push: '$members' },
          lastMessage: { $first: '$lastMessage' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
    ];
  }

  async membersPipeline(): Promise<any> {
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
        $set: {
          members: {
            $mergeObjects: ['$members', { $arrayElemAt: ['$userDetails', 0] }],
          },
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$chatId', '$$chatId'] } } },
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

  async findOneById(chatId: string): Promise<ChatDocument> {
    const chatObjectId = new ObjectId(chatId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const chat = await this.ChatModel.aggregate([
      { $match: { _id: chatObjectId, isActive: true } },
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ])
      .cursor()
      .next();
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    return chat;
  }

  async create(data: CreateChatInput): Promise<ChatDocument> {
    const { userId, queueId, type, friendUserIds } = data;
    if (queueId) {
      const duplicateChat = await this.ChatModel.findOne({ queueId }).lean();
      if (duplicateChat) {
        throw new BadRequestException('Duplicate Chat found.');
      }
    }
    const members = [userId, ...friendUserIds].map((id, idx) => ({
      _id: new ObjectId(id),
      hasAdded: idx === 0,
    }));
    const newChat = new this.ChatModel({
      queueId,
      type,
      members,
    });
    const savedChat = (await newChat.save()).toObject();
    const { _id: chatId } = savedChat;
    const chat = await this.findOneById(String(chatId));
    return chat;
  }

  async findAll(userId: string, args: ChatArgs): Promise<ChatDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const chats = await this.ChatModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...membersPipeline,
      ...groupPipeline,
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

  async remove(chatId: string): Promise<boolean> {
    return true;
  }
}
