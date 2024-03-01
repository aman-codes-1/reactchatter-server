import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ChatArgs } from './dto/chat.args';
import { ChatsInput } from './dto/chat.input';
import { Chat } from './models/chat.model';
import { Chat as ChatSchema, ChatDocument } from './chat.schema';
import { Friend, FriendDocument } from '../friend/friend.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSchema.name) private ChatModel: Model<ChatDocument>,
    @InjectModel(Friend.name) private FriendModel: Model<FriendDocument>,
  ) {
    //
  }

  async create(data: Chat): Promise<ChatSchema> {
    const {
      friendId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
    } = data;
    const friendObjectId = new ObjectId(friendId);
    const senderObjectId = new ObjectId(senderId);
    const receiverObjectId = new ObjectId(receiverId);
    const friend = await this.FriendModel.findOne({
      $or: [
        {
          $and: [
            { _id: friendObjectId },
            { addedByUserId: senderObjectId },
            { userId: receiverObjectId },
            { isFriend: true },
          ],
        },
        {
          $and: [
            { _id: friendObjectId },
            { addedByUserId: receiverObjectId },
            { userId: senderObjectId },
            { isFriend: true },
          ],
        },
      ],
    }).lean();
    if (!friend) {
      throw new BadRequestException('Friend not found.');
    }
    const newChatData = {
      ...data,
      friendId: friendObjectId,
      sender: {
        ...data?.sender,
        _id: senderObjectId,
      },
      receiver: {
        ...data.receiver,
        _id: receiverObjectId,
      },
    };
    const newChat = new this.ChatModel(newChatData);
    await newChat.save();
    return newChat?._doc ? newChat?._doc : newChat;
  }

  async findOneById(chatId: string): Promise<ChatSchema> {
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.ChatModel.findOne({ _id: chatObjectId }).lean();
    if (!chat) {
      throw new BadRequestException('Chat not found');
    }
    return chat;
  }

  async findAll(data: ChatsInput, chatArgs: ChatArgs): Promise<Chat[]> {
    const { friendId } = data;
    const friendObjectId = new ObjectId(friendId);
    const { limit, skip } = chatArgs;
    const chats = await this.ChatModel.find({ friendId: friendObjectId })
      .limit(limit)
      .skip(skip)
      .sort({ $natural: -1 })
      .lean();
    return chats.reverse() as unknown as Chat[];
  }

  async remove(id: string): Promise<boolean> {
    return true;
  }
}
