import { Field, InputType } from '@nestjs/graphql';

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
