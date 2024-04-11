import { Field, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@InputType({ description: 'FriendInput' })
export class FriendInput {
  @Field(() => String)
  friendId: string;
}

@InputType({ description: 'FriendsInput' })
export class FriendsInput {
  @Field(() => String)
  userId: string;
}

@InputType({ description: 'CreateFriendInput' })
export class CreateFriendInput {
  @Field(() => Types.ObjectId)
  sentByUserId: Types.ObjectId;

  @Field(() => Types.ObjectId)
  sentToUserId: Types.ObjectId;

  @Field(() => String)
  status: string;
}
