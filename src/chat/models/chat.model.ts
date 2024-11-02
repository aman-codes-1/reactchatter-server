import { Field, ObjectType } from '@nestjs/graphql';
import { Auth } from '../../auth/models/auth.model';

@ObjectType({ description: 'ChatMemberObject' })
class ChatMember {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasCreated: boolean;

  @Field(() => Boolean, { nullable: true })
  isAdmin?: boolean;

  @Field(() => Auth, { nullable: true })
  memberDetails?: Auth;
}

@ObjectType({ description: 'ChatObject' })
export class Chat {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  queueId: string;

  @Field(() => Boolean)
  isActive: boolean;

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
