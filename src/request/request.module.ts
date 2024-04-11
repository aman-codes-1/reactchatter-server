import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { Friend, FriendSchema } from '../friend/friend.schema';
import { Request, RequestSchema } from './request.schema';
import { RequestResolver } from './request.resolver';
import { RequestService } from './request.service';
import { FriendService } from '../friend/friend.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Request.name,
        schema: RequestSchema,
        collection: 'requests',
      },
    ]),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema, collection: 'users' },
    ]),
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
  ],
  providers: [RequestResolver, RequestService, FriendService],
})
export class RequestModule {}
