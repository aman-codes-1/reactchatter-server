import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from './chat.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema, collection: 'chats' },
    ]),
  ],
  providers: [ChatResolver, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
