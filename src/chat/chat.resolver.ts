import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatArgs } from './dto/chat.args';
import { ChatInput, ChatsInput, CreateChatInput } from './dto/chat.input';
import { Chat, ChatData } from './models/chat.model';
import { Chat as ChatSchema } from './chat.schema';
import { ChatService } from './chat.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

const pubSub = new PubSub();

@Resolver(() => Chat)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Chat)
  async chat(@Args('input') input: ChatInput): Promise<ChatSchema> {
    const { chatId } = input;
    const chat = await this.chatService.findOneById(chatId);
    return chat;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Chat])
  async chats(
    @Args('input') input: ChatsInput,
    @Args() args: ChatArgs,
  ): Promise<ChatSchema[]> {
    const { userId } = input;
    const chats = await this.chatService.findAll(userId, args);
    return chats;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Chat)
  async createChat(@Args('input') input: CreateChatInput): Promise<ChatSchema> {
    const { friendId } = input;
    const newChat = await this.chatService.create(input);
    pubSub.publish('OnChatAdded', {
      OnChatAdded: {
        friendId,
        chat: newChat,
      },
    });
    return newChat;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Chat)
  async updateChat(@Args('input') input: CreateChatInput): Promise<ChatSchema> {
    const { friendId } = input;
    const updatedChat = await this.chatService.create(input);
    pubSub.publish('OnChatUpdated', {
      OnChatUpdated: {
        friendId,
        chat: updatedChat,
      },
    });
    return updatedChat;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeChat(@Args('id') id: string) {
    return this.chatService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ChatData)
  OnChatAdded() {
    return pubSub.asyncIterator('OnChatAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ChatData)
  OnChatUpdated() {
    return pubSub.asyncIterator('OnChatUpdated');
  }
}
