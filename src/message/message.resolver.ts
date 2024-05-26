import { UseGuards } from '@nestjs/common';
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
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

const pubSub = new PubSub();

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {
    //
  }

  @UseGuards(GqlAuthGuard)
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

  @UseGuards(GqlAuthGuard)
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

  @UseGuards(GqlAuthGuard)
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
      data: newMessage,
    };
  }

  @UseGuards(GqlAuthGuard)
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
      data: updatedMessage,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeMessage(@Args('id') id: string) {
    return this.messageService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessageData)
  OnMessageAdded() {
    return pubSub.asyncIterator('OnMessageAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessagesData)
  OnMessagesAdded() {
    return pubSub.asyncIterator('OnMessagesAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessageData)
  OnMessageUpdated() {
    return pubSub.asyncIterator('OnMessageUpdated');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessagesData)
  OnMessagesUpdated() {
    return pubSub.asyncIterator('OnMessagesUpdated');
  }
}
