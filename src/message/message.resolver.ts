import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { MessageArgs } from './dto/message.args';
import {
  CreateMessageInput,
  MessageInput,
  MessagesInput,
} from './dto/message.input';
import { Message, MessageData, MessagesData } from './models/message.model';
import { MessageService } from './message.service';

const pubSub = new PubSub();

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {
    //
  }

  @Query(() => MessageData)
  async message(@Args('input') input: MessageInput): Promise<MessageData> {
    const { userId, chatId, messageId } = input;
    const message = await this.messageService.findOneById(messageId);
    return {
      userId,
      chatId,
      data: message,
    };
  }

  @Query(() => MessagesData)
  async messages(
    @Args('input') input: MessagesInput,
    @Args() args: MessageArgs,
  ): Promise<MessagesData> {
    const { userId, chatId } = input;
    const messages = await this.messageService.findAll(chatId, args);
    return {
      userId,
      chatId,
      data: messages,
    };
  }

  @Mutation(() => MessageData)
  async createMessage(
    @Args('input') input: CreateMessageInput,
    @Args() args: MessageArgs,
  ): Promise<MessageData> {
    const { userId, chatId } = input;
    const newMessage = await this.messageService.create(input);
    const messages = await this.messageService.findAll(chatId, args);
    pubSub.publish('OnMessageAdded', {
      OnMessageAdded: {
        userId,
        chatId,
        data: newMessage,
      },
    });
    pubSub.publish('OnMessagesAdded', {
      OnMessagesAdded: {
        userId,
        chatId,
        data: messages,
      },
    });
    return {
      userId,
      chatId,
      data: newMessage as unknown as Message,
    };
  }

  @Mutation(() => MessageData)
  async updateMessage(
    @Args('input') input: CreateMessageInput,
    @Args() args: MessageArgs,
  ): Promise<MessageData> {
    const { userId, chatId } = input;
    const updatedMessage = await this.messageService.create(input);
    const messages = await this.messageService.findAll(chatId, args);
    pubSub.publish('OnMessageUpdated', {
      OnMessageUpdated: {
        userId,
        chatId,
        data: updatedMessage,
      },
    });
    pubSub.publish('OnMessageUpdated', {
      OnMessagesUpdated: {
        userId,
        chatId,
        data: messages,
      },
    });
    return {
      userId,
      chatId,
      data: updatedMessage as unknown as Message,
    };
  }

  @Mutation(() => Boolean)
  async removeMessage(@Args('id') id: string) {
    return this.messageService.remove(id);
  }

  @Subscription(() => MessageData)
  OnMessageAdded() {
    return pubSub.asyncIterator('OnMessageAdded');
  }

  @Subscription(() => MessagesData)
  OnMessagesAdded() {
    return pubSub.asyncIterator('OnMessagesAdded');
  }

  @Subscription(() => MessageData)
  OnMessageUpdated() {
    return pubSub.asyncIterator('OnMessageUpdated');
  }

  @Subscription(() => MessagesData)
  OnMessagesUpdated() {
    return pubSub.asyncIterator('OnMessagesUpdated');
  }
}
