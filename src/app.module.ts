import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Enhancer, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';
import { MessageModule } from './message/message.module';
import { RequestModule } from './request/request.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    FriendModule,
    MessageModule,
    RequestModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, { dbName: 'ReactChatter' }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      fieldResolverEnhancers: ['interceptors'] as Enhancer[],
      autoTransformHttpErrors: true,
      introspection: process.env.NODE_ENV !== 'production',
      installSubscriptionHandlers: true,
      context: ({ req, connection }) =>
        connection ? { req: connection?.context } : { req },
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
