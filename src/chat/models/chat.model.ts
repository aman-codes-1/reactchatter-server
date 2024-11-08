import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/auth.model';

@ObjectType({ description: 'ChatMemberObject' })
class ChatMember extends User {
  @Field(() => Boolean, { nullable: true })
  hasCreated?: boolean;

  @Field(() => Boolean, { nullable: true })
  isAdmin?: boolean;
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
  @Field(() => [String])
  friendIds: string[];

  @Field(() => Chat)
  chat: Chat;
}
