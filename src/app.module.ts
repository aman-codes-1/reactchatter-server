import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import configuration from './config/configuration';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    FriendModule,
    MessageModule,
    RequestModule,
    SocketModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_URI'),
        dbName: 'ReactChatter',
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        playground: true,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        fieldResolverEnhancers: ['interceptors'] as Enhancer[],
        autoTransformHttpErrors: true,
        introspection: !!configService.get('isDevelopment'),
        installSubscriptionHandlers: true,
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            onConnect: (ctx: any) => {
              ctx.req = ctx?.extra?.request;
              return ctx;
            },
          },
          'subscriptions-transport-ws': true,
        },
        context: ({ req, res }) => ({ req, res }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
