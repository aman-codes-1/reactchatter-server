import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'FriendMemberDetailsObject' })
class FriendMemberDetails {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => Boolean)
  email_verified: boolean;

  @Field(() => String)
  picture: string;

  @Field(() => String)
  given_name: string;

  @Field(() => String)
  family_name: string;
}

@ObjectType({ description: 'FriendMemberObject' })
class FriendMember {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasAdded: boolean;

  @Field(() => FriendMemberDetails, { nullable: true })
  memberDetails: FriendMemberDetails;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isFriend: boolean;

  @Field(() => [FriendMember])
  members: FriendMember[];
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
