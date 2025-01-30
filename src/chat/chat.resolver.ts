import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatArgs } from './dto/chat.args';
import { ChatInput, ChatsInput, CreateChatInput } from './dto/chat.input';
import { Chat, ChatData } from './models/chat.model';
import { ChatService } from './chat.service';
import { ChatDocument } from './chat.schema';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Chat)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Chat)
  async chat(@Args('input') input: ChatInput): Promise<ChatDocument> {
    const { chatId } = input;
    const chat = await this.chatService.findOneById(chatId);
    return chat;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Chat])
  async chats(
    @Args('input') input: ChatsInput,
    @Args() args: ChatArgs,
  ): Promise<ChatDocument[]> {
    const { userId } = input;
    const chats = await this.chatService.findAll(userId, args);
    return chats;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ChatData)
  async createChat(@Args('input') input: CreateChatInput): Promise<ChatData> {
    const { friendIds, friendUserIds } = input;
    const newChat = (await this.chatService.create(input)) as unknown as Chat;
    await this.pubSubService.pubSubInstance.publish('OnChatAdded', {
      OnChatAdded: {
        friendIds,
        chat: newChat,
      },
    });
    return {
      chat: newChat,
      friendIds,
      friendUserIds,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ChatData)
  OnChatAdded() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnChatAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ChatData)
  OnChatUpdated() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnChatUpdated');
  }
}
