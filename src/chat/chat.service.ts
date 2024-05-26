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

  async findOneById(chatId: string): Promise<Chat> {
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
                _id: '$_id',
                __v: '$__v',
                name: '$name',
                email: '$email',
                email_verified: '$email_verified',
                picture: '$picture',
                given_name: '$given_name',
                family_name: '$family_name',
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
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      { $limit: 1 },
    ]);
    if (!chat?.length) {
      throw new BadRequestException('Chat not found');
    }
    return chat?.[0];
  }

  async create(data: CreateChatInput): Promise<Chat> {
    const { userId, type, friendUserId } = data;
    const members = [userId, friendUserId].map((id, idx) => ({
      _id: new ObjectId(id),
      hasAdded: idx === 0,
    }));
    const newChat = new this.ChatModel({
      type,
      members,
    });
    const savedChat = await newChat.save();
    const { _id: chatId } = savedChat.toObject();
    const chat = await this.findOneById(String(chatId));
    return chat || savedChat.toObject();
  }

  async findAll(userId: string, args: ChatArgs): Promise<Chat[]> {
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
                _id: '$_id',
                __v: '$__v',
                name: '$name',
                email: '$email',
                email_verified: '$email_verified',
                picture: '$picture',
                given_name: '$given_name',
                family_name: '$family_name',
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
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      { $limit: limit },
      { $skip: skip },
      { $sort: { createdAt: -1 } },
    ]);
    return chats;
  }

  async remove(chatId: string): Promise<boolean> {
    return true;
  }
}
