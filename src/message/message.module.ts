import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DateScalar } from '../common/scalars/date.scalar';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './message.schema';
import { Friend, FriendSchema } from '../friend/friend.schema';
import { Chat, ChatSchema } from '../chat/chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema, collection: 'chats' },
    ]),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema, collection: 'messages' },
    ]),
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
  ],
  providers: [MessageResolver, MessageService, DateScalar],
})
export class MessageModule {}
