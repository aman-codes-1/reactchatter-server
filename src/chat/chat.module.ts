import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from './chat.schema';
import { FriendService } from '../friend/friend.service';
import { SocketGateway } from '../socket/socket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema, collection: 'chats' },
    ]),
  ],
  providers: [ChatResolver, ChatService, SocketGateway],
})
export class ChatModule {}
