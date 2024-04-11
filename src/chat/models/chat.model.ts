import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType('MemberDetailsInput')
@ObjectType('MemberDetailsObject')
export class MemberDetails {
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

@InputType('MemberInput')
@ObjectType('MemberObject')
export class Member {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasAdded: boolean;

  @Field(() => Boolean, { nullable: true })
  isAdmin: boolean;

  @Field(() => MemberDetails, { nullable: true })
  memberDetails: MemberDetails;
}

@ObjectType('ChatObject')
export class Chat {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  type: string;

  @Field(() => [Member])
  members: Member[];
}

@ObjectType({ description: 'ChatDataObject' })
export class ChatData {
  @Field(() => String)
  friendId: string;

  @Field(() => Chat)
  chat: Chat;
}
