import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { Friend, FriendSchema } from '../friend/friend.schema';
import { Request, RequestSchema } from './request.schema';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { FriendService } from '../friend/friend.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema, collection: 'users' },
    ]),
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
    MongooseModule.forFeature([
      {
        name: Request.name,
        schema: RequestSchema,
        collection: 'requests',
      },
    ]),
  ],
  controllers: [RequestController],
  providers: [RequestService, FriendService],
})
export class RequestModule {}
