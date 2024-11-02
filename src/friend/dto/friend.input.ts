import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'FriendsInput' })
export class FriendsInput {
  @Field(() => String)
  userId: string;
}

@InputType({ description: 'FriendInput' })
export class FriendInput extends FriendsInput {
  @Field(() => String)
  friendId: string;
}
