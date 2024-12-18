import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Enhancer, GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DateScalar } from './common/scalars/date.scalar';
import { AnyScalar } from './common/scalars/any.scalar';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';
import { MessageModule } from './message/message.module';
import { RequestModule } from './request/request.module';
import { SharedModule } from './shared/shared.module';
import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { UserClientModule } from './userClient/userClient.module';
import { UserSessionModule } from './userSession/userSession.module';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    FriendModule,
    MessageModule,
    RequestModule,
    SharedModule,
    SocketModule,
    UserModule,
    UserClientModule,
    UserSessionModule,
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
        introspection: !configService.get('isProduction'),
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
  providers: [AppService, DateScalar, AnyScalar],
})
export class AppModule {}
