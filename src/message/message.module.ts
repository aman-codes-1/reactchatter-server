import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { DateScalar } from '../common/scalars/date.scalar';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './message.schema';
import { Friend, FriendSchema } from '../friend/friend.schema';
import { Chat, ChatSchema } from '../chat/chat.schema';
import { User, UserSchema } from '../user/user.schema';
import { AuthService } from '../auth/auth.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema, collection: 'chats' },
    ]),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema, collection: 'messages' },
    ]),
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema, collection: 'users' },
    ]),
  ],
  providers: [
    MessageResolver,
    MessageService,
    DateScalar,
    AuthService,
    JwtStrategy,
  ],
})
export class MessageModule {}
