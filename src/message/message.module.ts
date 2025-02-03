import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './message.schema';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';
import { UserClientModule } from '../userClient/userClient.module';
import { UserSessionModule } from '../userSession/userSession.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SharedModule,
    ChatModule,
    UserClientModule,
    UserSessionModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema, collection: 'messages' },
    ]),
  ],
  providers: [MessageResolver, MessageService],
  exports: [MessageService],
})
export class MessageModule {}
