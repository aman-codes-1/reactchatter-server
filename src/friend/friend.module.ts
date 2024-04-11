import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendResolver } from './friend.resolver';
import { FriendService } from './friend.service';
import { Friend, FriendSchema } from './friend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
  ],
  providers: [FriendResolver, FriendService],
})
export class FriendModule {}
