import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DateScalar } from '../common/scalars/date.scalar';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './message.schema';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema, collection: 'messages' },
    ]),
  ],
  providers: [MessageResolver, MessageService, DateScalar],
  exports: [MessageService],
})
export class MessageModule {}
