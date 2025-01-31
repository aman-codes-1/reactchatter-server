import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { Message } from '../../message/models/message.model';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'FriendMemberObject' })
class FriendMember extends User {
  @Field(() => Boolean)
  hasAdded: boolean;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => [FriendMember])
  members: FriendMember[];

  @Field(() => Message, { nullable: true })
  lastMessage?: Message;

  @Field(() => Boolean, { nullable: true })
  hasChats?: boolean;

  @Field(() => DateScalar)
  createdAt: Date;

  @Field(() => DateScalar)
  updatedAt: Date;
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
