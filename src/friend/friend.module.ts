import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Friend, FriendSchema } from './friend.schema';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friend.name, schema: FriendSchema, collection: 'friends' },
    ]),
  ],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
