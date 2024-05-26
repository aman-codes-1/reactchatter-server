import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Enhancer, GqlExecutionContext, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import * as cookie from 'cookie';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
        // context: ({ req, connection }) =>
        //   connection ? { req: connection?.context } : { req },
        // context: ({ req, connection }) =>
        //   connection ? connection?.context : { req },
        // context: ({ req, res, extra }) => {
        //   if (extra) {
        //     const context = { req, res, extra };
        //     const contextCookie = context?.extra?.request?.headers?.cookie;
        //     const cookies = cookie.parse(contextCookie || '');
        //     let token = cookies?.token;
        //     if (token && token?.startsWith('s:')) {
        //       token = token?.slice(2);
        //     } else {
        //       token = null;
        //     }
        //     context.extra.token = token;
        //     return context;
        //   }
        //   return {
        //     req,
        //     res,
        //   };
        // },
        subscriptions: {
          'graphql-ws': true,
          'subscriptions-transport-ws': {
            onConnect: (_: any, __: any, context: any) => {
              context.req = context.request;
              return context;
            },
          },
        },
        context: ({ req, res }) => ({ req, res }),
      }),
    }),
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
