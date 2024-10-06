import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MessageArgs } from './dto/message.args';
import { CreateMessageInput } from './dto/message.input';
import { Message } from './models/message.model';
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

  async findOneById(messageId: string): Promise<Message> {
    const messageObjectId = new ObjectId(messageId);
    const message = await this.MessageModel.findById(messageObjectId).lean();
    if (!message) {
      throw new BadRequestException('Message not found.');
    }
    return message as unknown as Message;
  }

  async findOneByQueueId(queueId: string): Promise<Message> {
    const message = await this.MessageModel.findOne({ queueId }).lean();
    if (!message) {
      throw new BadRequestException('Message not found.');
    }
    return message as unknown as Message;
  }

  async create(data: CreateMessageInput): Promise<MessageSchema> {
    const { chatId, senderId, queueId, timestamp, ...rest } = data || {};
    const duplicateMessage = await this.MessageModel.findOne({
      queueId,
    }).lean();
    if (duplicateMessage) {
      throw new BadRequestException('Duplicate Message found.');
    }
    const chat = await this.chatService.findOneById(chatId);
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
    const chatObjectId = new ObjectId(chatId);
    const senderObjectId = new ObjectId(senderId);
    const { members } = chat || {};
    const otherMembers = members
      .filter((el) => String(el?._id) !== String(senderId))
      .map((el) => ({
        _id: new ObjectId(el?._id),
      }));
    const newMessageData = {
      ...rest,
      chatId: chatObjectId,
      queueId,
      sender: {
        _id: senderObjectId,
        sentStatus: {
          isSent: true,
          timestamp,
        },
      },
      otherMembers,
    };
    const newMessage = new this.MessageModel(newMessageData);
    const savedMessage = await newMessage.save();
    return savedMessage.toObject();
  }

  async findAll(chatId: string, messageArgs: MessageArgs): Promise<Message[]> {
    const chatObjectId = new ObjectId(chatId);
    const chat = await this.chatService.findOneById(chatId);
    if (!chat) {
      throw new BadRequestException('Chat not found.');
    }
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
