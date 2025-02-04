import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { Message } from '../../message/models/message.model';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'ChatMemberObject' })
class ChatMember extends User {
  @Field(() => Boolean)
  hasAdded: boolean;

  @Field(() => Boolean, { nullable: true })
  isAdmin?: boolean;

  @Field(() => Int, { nullable: true })
  unreadMessagesCount?: number;
}

@ObjectType({ description: 'ChatFriendMemberObject' })
class ChatFriendMember {
  @Field(() => String)
  _id: string;
}

@ObjectType({ description: 'ChatObject' })
export class Chat {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String)
  type: string;

  @Field(() => [ChatMember])
  members: ChatMember[];

  @Field(() => [ChatFriendMember])
  friends: ChatFriendMember[];

  @Field(() => Message, { nullable: true })
  lastMessage?: Message;

  @Field(() => DateScalar)
  createdAt: Date;

  @Field(() => DateScalar)
  updatedAt: Date;
}

@ObjectType({ description: 'CreateChatDataObject' })
export class CreateChatData {
  @Field(() => Boolean)
  isAlreadyCreated: boolean;

  @Field(() => Chat)
  chat: Chat;
}

@ObjectType({ description: 'ChatDataObject' })
export class ChatData {
  @Field(() => [String], { nullable: true })
  friendIds?: string[];

  @Field(() => Chat)
  chat: Chat;
}
