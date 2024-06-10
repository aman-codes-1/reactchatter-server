import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      expandVariables: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'build'),
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
          'graphql-ws': true,
          'subscriptions-transport-ws': {
            onConnect: (_: any, __: any, context: any) => {
              context.req = context.request;
              return context;
            },
          },
        },
        context: ({ req, res }) => ({ req, res }),
        // context: ({ req, connection }) =>
        //   connection ? { req: connection?.context } : { req },
        // context: ({ req, connection }) =>
        //   connection ? connection?.context : { req },
      }),
    }),
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
