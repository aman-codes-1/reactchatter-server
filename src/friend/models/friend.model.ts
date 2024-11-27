import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/auth.model';
import { Message } from '../../message/models/message.model';

@ObjectType({ description: 'FriendMemberObject' })
class Member extends User {
  @Field(() => Boolean)
  hasAdded: boolean;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  queueId?: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => [Member])
  members: Member[];

  @Field(() => Message, { nullable: true })
  lastMessage?: Message;

  @Field(() => Boolean, { nullable: true })
  hasChats?: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
