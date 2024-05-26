import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'ChatMemberDetailsObject' })
class ChatMemberDetails {
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

@ObjectType({ description: 'ChatMemberObject' })
class ChatMember {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasAdded: boolean;

  @Field(() => Boolean, { nullable: true })
  isAdmin: boolean;

  @Field(() => ChatMemberDetails, { nullable: true })
  memberDetails: ChatMemberDetails;
}

@ObjectType({ description: 'ChatObject' })
export class Chat {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  type: string;

  @Field(() => [ChatMember])
  members: ChatMember[];
}

@ObjectType({ description: 'ChatDataObject' })
export class ChatData {
  @Field(() => String)
  friendId: string;

  @Field(() => Chat)
  chat: Chat;
}
