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

  async findOneById(chatId: string): Promise<ChatSchema> {
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.ChatModel.aggregate([
      { $match: { _id: chatObjectId } },
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
                _id: 1,
                name: 1,
                email: 1,
                email_verified: 1,
                picture: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'memberDetails',
        },
      },
      {
        $unwind: '$memberDetails',
      },
      {
        $addFields: {
          'members.memberDetails': '$memberDetails',
        },
      },
      {
        $group: {
          _id: '$_id',
          queueId: { $first: '$queueId' },
          type: { $first: '$type' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          members: { $push: '$members' },
        },
      },
      { $limit: 1 },
    ]);
    if (!chat?.length) {
      throw new BadRequestException('Chat not found.');
    }
    return chat?.[0];
  }

  async create(data: CreateChatInput): Promise<ChatSchema> {
    const { userId, queueId, type, friendUserId } = data;
    const duplicateChat = await this.ChatModel.findOne({ queueId }).lean();
    if (duplicateChat) {
      throw new BadRequestException('Duplicate Chat found.');
    }
    const members = [userId, friendUserId].map((id, idx) => ({
      _id: new ObjectId(id),
      hasAdded: idx === 0,
    }));
    const newChat = new this.ChatModel({
      queueId,
      type,
      members,
    });
    const savedChat = await newChat.save();
    const { _id: chatId } = savedChat.toObject();
    const chat = await this.findOneById(String(chatId));
    return chat || savedChat.toObject();
  }

  async findAll(userId: string, args: ChatArgs): Promise<ChatSchema[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, skip } = args;
    const chats = await this.ChatModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
        },
      },
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
                _id: 1,
                name: 1,
                email: 1,
                email_verified: 1,
                picture: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'memberDetails',
        },
      },
      {
        $unwind: '$memberDetails',
      },
      {
        $addFields: {
          'members.memberDetails': '$memberDetails',
        },
      },
      {
        $group: {
          _id: '$_id',
          type: { $first: '$type' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          members: { $push: '$members' },
        },
      },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ]);
    return chats;
  }

  async remove(chatId: string): Promise<boolean> {
    return true;
  }
}
