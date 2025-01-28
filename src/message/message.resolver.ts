import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { MessageArgs } from './dto/message.args';
import {
  CreateMessageInput,
  MessageInput,
  MessagesInput,
} from './dto/message.input';
import { Message, MessageData, MessagesData } from './models/message.model';
import { MessageService } from './message.service';
import { MessageDocument } from './message.schema';
import { ChatService } from '../chat/chat.service';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Message)
export class MessageResolver {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Message)
  async message(@Args('input') input: MessageInput): Promise<MessageDocument> {
    const { messageId } = input;
    const message = await this.messageService.findOneById(messageId);
    return message;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => MessagesData)
  async messages(
    @Args('input') input: MessagesInput,
    @Args() args: MessageArgs,
  ): Promise<MessagesData> {
    const { chatId } = input;
    const messages = await this.messageService.findAll(chatId, args);
    return messages;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => MessagesData)
  async cachedMessages(
    @Args('input') input: MessagesInput,
  ): Promise<MessagesData> {
    return {
      edges: [],
      pageInfo: {
        endCursor: '',
        hasPreviousPage: false,
        hasNextPage: false,
      },
      scrollPosition: 0,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async createMessage(
    @Args('input') input: CreateMessageInput,
  ): Promise<MessageDocument> {
    const { chatId } = input;
    const newMessage = await this.messageService.create(input);
    await this.pubSubService.pubSubInstance.publish('OnMessageAdded', {
      OnMessageAdded: {
        message: newMessage,
      },
    });
    const updatedChat = await this.chatService.findOneById(chatId);
    await this.pubSubService.pubSubInstance.publish('OnChatUpdated', {
      OnChatUpdated: {
        chat: updatedChat,
      },
    });
    await this.messageService.deliverMessage(newMessage, String(chatId));
    return newMessage;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessageData)
  OnMessageAdded() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnMessageAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => MessageData)
  OnMessageUpdated() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnMessageUpdated');
  }
}
