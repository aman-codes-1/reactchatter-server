import { Module } from '@nestjs/common';
import { Enhancer, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { DateScalar } from '../common/scalars/date.scalar';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from './chat.schema';
import { Friend, FriendSchema } from '../friend/friend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema, collection: 'chats' },
    ]),
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
      sortSchema: true,
      fieldResolverEnhancers: ['interceptors'] as Enhancer[],
      autoTransformHttpErrors: true,
      introspection: process.env.NODE_ENV !== 'production',
      context: (context: any) => context,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
  ],
  providers: [ChatResolver, ChatService, DateScalar],
})
export class ChatModule {}
