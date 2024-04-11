import { Field, ObjectType } from '@nestjs/graphql';
import { MemberDetails } from '../../chat/models/chat.model';

@ObjectType({ description: 'MemberObject' })
class Member {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasAdded: boolean;

  @Field(() => MemberDetails, { nullable: true })
  memberDetails: MemberDetails;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isFriend: boolean;

  @Field(() => [Member])
  members: Member[];
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
