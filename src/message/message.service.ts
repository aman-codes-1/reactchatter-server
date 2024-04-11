import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MessageArgs } from './dto/message.args';
import { CreateMessageInput } from './dto/message.input';
import { Message } from './models/message.model';
import { Message as MessageSchema, MessageDocument } from './message.schema';
import { Chat, ChatDocument } from '../chat/chat.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(MessageSchema.name)
    private MessageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private ChatModel: Model<ChatDocument>,
  ) {
    //
  }

  async create(data: CreateMessageInput): Promise<MessageSchema> {
    const { chatId, sender, otherMembers } = data;
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.ChatModel.findOne({
      _id: chatObjectId,
    }).lean();
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    const senderObjectId = new ObjectId(sender?._id);
    const otherMembersWithObjectId = otherMembers.map((el) => ({
      ...el,
      _id: new ObjectId(el?._id),
    }));
    const newMessageData = {
      ...data,
      chatId: chatObjectId,
      sender: {
        ...data?.sender,
        _id: senderObjectId,
      },
      otherMembersWithObjectId,
    };
    const newMessage = new this.MessageModel(newMessageData);
    const savedMessage = await newMessage.save();
    return savedMessage.toObject();
  }

  async findOneById(messageId: string): Promise<Message> {
    const messageObjectId = new ObjectId(messageId);
    const message = await this.MessageModel.findOne({
      _id: messageObjectId,
    }).lean();
    if (!message) {
      throw new BadRequestException('Message not found');
    }
    return message as unknown as Message;
  }

  async findAll(chatId: string, messageArgs: MessageArgs): Promise<Message[]> {
    const chatObjectId = new ObjectId(chatId);
    const { limit, skip } = messageArgs;
    const messages = await this.MessageModel.find({ chatId: chatObjectId })
      .limit(limit)
      .skip(skip)
      .sort({ $natural: -1 })
      .lean();
    return messages.reverse() as unknown as Message[];
  }

  async remove(messageId: string): Promise<boolean> {
    return true;
  }
}
