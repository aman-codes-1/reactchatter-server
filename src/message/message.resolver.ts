import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { MessageArgs } from './dto/message.args';
import {
  CreateMessageInput,
  MessageInput,
  MessagesInput,
} from './dto/message.input';
import { Message, MessageData } from './models/message.model';
import { MessageService } from './message.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

const pubSub = new PubSub();

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Message)
  async message(@Args('input') input: MessageInput): Promise<Message> {
    const { messageId } = input;
    const message = await this.messageService.findOneById(messageId);
    return message;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Message])
  async messages(
    @Args('input') input: MessagesInput,
    @Args() args: MessageArgs,
  ): Promise<Message[]> {
    const { chatId } = input;
    const messages = await this.messageService.findAll(chatId, args);
    return messages;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async createMessage(
    @Args('input') input: CreateMessageInput,
  ): Promise<Message> {
    const { chatId } = input;
    const newMessage = await this.messageService.create(input);
    pubSub.publish('OnMessageAdded', {
      OnMessageAdded: {
        chatId,
        message: newMessage,
      },
    });
    return newMessage;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async updateMessage(
    @Args('input') input: CreateMessageInput,
  ): Promise<Message> {
    const { chatId } = input;
    const updatedMessage = await this.messageService.create(input);
    pubSub.publish('OnMessageUpdated', {
      OnMessageUpdated: {
        chatId,
        message: updatedMessage,
      },
    });
    return updatedMessage;
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
  @Subscription(() => MessageData)
  OnMessageUpdated() {
    return pubSub.asyncIterator('OnMessageUpdated');
  }
}
