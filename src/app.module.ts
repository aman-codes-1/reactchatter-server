import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';
import { RequestModule } from './request/request.module';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    FriendModule,
    RequestModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, { dbName: 'ReactChatter' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
