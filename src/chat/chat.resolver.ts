import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatArgs } from './dto/chat.args';
import { ChatsInput } from './dto/chat.input';
import { Chat, ChatData, ChatsData } from './models/chat.model';
import { ChatService } from './chat.service';
import { Chat as ChatSchema } from './chat.schema';

const pubSub = new PubSub();

@Resolver(() => Chat)
export class ChatResolver {
  constructor(private readonly ChatServices: ChatService) {
    //
  }

  @Query((returns) => Chat)
  async chat(@Args('chatId') chatId: string): Promise<ChatSchema> {
    const chat = await this.ChatServices.findOneById(chatId);
    return chat;
  }

  @Query((returns) => [Chat])
  async chats(
    @Args('chatData') chatData: ChatsInput,
    @Args() chatArgs: ChatArgs,
  ): Promise<Chat[]> {
    const chats = await this.ChatServices.findAll(chatData, chatArgs);
    return chats;
  }

  @Mutation((returns) => Chat)
  async createChat(
    @Args('chatData') chatData: Chat,
    @Args() chatArgs: ChatArgs,
  ): Promise<ChatSchema> {
    const { friendId } = chatData;
    const newChat = await this.ChatServices.create(chatData);
    const chats = await this.ChatServices.findAll(chatData, chatArgs);
    pubSub.publish('OnChatAdded', {
      OnChatAdded: {
        friendId,
        data: newChat,
      },
    });
    pubSub.publish('OnChatsAdded', {
      OnChatsAdded: {
        friendId,
        data: chats,
      },
    });
    return newChat;
  }

  @Mutation((returns) => Chat)
  async updateChat(
    @Args('chatData') chatData: Chat,
    @Args() chatArgs: ChatArgs,
  ): Promise<ChatSchema> {
    const { friendId } = chatData;
    const updatedChat = await this.ChatServices.create(chatData);
    const chats = await this.ChatServices.findAll(chatData, chatArgs);
    pubSub.publish('OnChatUpdated', {
      OnChatUpdated: {
        friendId,
        data: updatedChat,
      },
    });
    pubSub.publish('OnChatUpdated', {
      OnChatsUpdated: {
        friendId,
        data: chats,
      },
    });
    return updatedChat;
  }

  @Mutation((returns) => Boolean)
  async removeChat(@Args('id') id: string) {
    return this.ChatServices.remove(id);
  }

  @Subscription((returns) => ChatData)
  OnChatAdded() {
    return pubSub.asyncIterator('OnChatAdded');
  }

  @Subscription((returns) => ChatsData)
  OnChatsAdded() {
    return pubSub.asyncIterator('OnChatsAdded');
  }

  @Subscription((returns) => ChatData)
  OnChatUpdated() {
    return pubSub.asyncIterator('OnChatUpdated');
  }

  @Subscription((returns) => ChatsData)
  OnChatsUpdated() {
    return pubSub.asyncIterator('OnChatsUpdated');
  }
}
