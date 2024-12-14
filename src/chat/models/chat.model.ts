import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { Message } from '../../message/models/message.model';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'ChatMemberObject' })
class ChatMember extends User {
  @Field(() => Boolean)
  hasAdded: boolean;

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

  @Field(() => Message, { nullable: true })
  lastMessage?: Message;

  @Field(() => DateScalar)
  createdAt: Date;

  @Field(() => DateScalar)
  updatedAt: Date;
}

@ObjectType({ description: 'ChatDataObject' })
export class ChatData {
  @Field(() => [String], { nullable: true })
  friendIds?: string[];

  @Field(() => Chat)
  chat: Chat;
}
