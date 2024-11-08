import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ChatArgs } from './dto/chat.args';
import { CreateChatInput } from './dto/chat.input';
import { Chat } from './models/chat.model';
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
    ];
  }

  async findOneById(chatId: string): Promise<Chat> {
    const chatObjectId = new ObjectId(chatId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const chat = await this.ChatModel.aggregate([
      { $match: { _id: chatObjectId, isActive: true } },
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ]);
    if (!chat?.length) {
      throw new BadRequestException('Chat not found.');
    }
    return chat?.[0];
  }

  async create(data: CreateChatInput): Promise<Chat> {
    const { userId, queueId, type, friendUserIds } = data;
    if (queueId) {
      const duplicateChat = await this.ChatModel.findOne({ queueId }).lean();
      if (duplicateChat) {
        throw new BadRequestException('Duplicate Chat found.');
      }
    }
    const members = [userId, ...friendUserIds].map((id, idx) => ({
      _id: new ObjectId(id),
      hasCreated: idx === 0,
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

  async findAll(userId: string, args: ChatArgs): Promise<Chat[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, skip } = args;
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const chats = await this.ChatModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          isActive: true,
        },
      },
      ...membersPipeline,
      ...groupPipeline,
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    return chats;
  }

  async remove(chatId: string): Promise<boolean> {
    return true;
  }
}
