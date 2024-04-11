import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatArgs } from './dto/chat.args';
import { ChatInput, ChatsInput, CreateChatInput } from './dto/chat.input';
import { Chat, ChatData } from './models/chat.model';
import { ChatService } from './chat.service';
import { SocketGateway } from '../socket/socket.gateway';

const pubSub = new PubSub();

@Resolver(() => Chat)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    private readonly socketGateway: SocketGateway,
  ) {
    //
  }

  @Query(() => Chat)
  async chat(@Args('input') input: ChatInput): Promise<Chat> {
    const { chatId } = input;
    const chat = await this.chatService.findOneById(chatId);
    return chat as unknown as Chat;
  }

  @Query(() => [Chat])
  async chats(
    @Args('input') input: ChatsInput,
    @Args() args: ChatArgs,
  ): Promise<Chat[]> {
    const { userId } = input;
    const chats = await this.chatService.findAll(userId, args);
    return chats;
  }

  @Mutation(() => Chat)
  async createChat(@Args('input') input: CreateChatInput): Promise<Chat> {
    const { friendId } = input;
    const newChat = await this.chatService.create(input);
    pubSub.publish('OnChatAdded', {
      OnChatAdded: {
        friendId,
        chat: newChat,
      },
    });
    return newChat as unknown as Chat;
  }

  @Mutation(() => Chat)
  async updateChat(@Args('input') input: CreateChatInput): Promise<Chat> {
    const { friendId } = input;
    const updatedChat = await this.chatService.create(input);
    pubSub.publish('OnChatUpdated', {
      OnChatUpdated: {
        friendId,
        chat: updatedChat,
      },
    });
    return updatedChat as unknown as Chat;
  }

  @Mutation(() => Boolean)
  async removeChat(@Args('id') id: string) {
    return this.chatService.remove(id);
  }

  @Subscription(() => ChatData)
  OnChatAdded() {
    return pubSub.asyncIterator('OnChatAdded');
  }

  @Subscription(() => ChatData)
  OnChatUpdated() {
    return pubSub.asyncIterator('OnChatUpdated');
  }
}
