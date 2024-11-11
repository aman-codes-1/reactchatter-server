import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/auth.model';

@ObjectType({ description: 'FriendMemberObject' })
class Member extends User {
  @Field(() => Boolean)
  hasConfirmed: boolean;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => [Member])
  members: Member[];

  @Field(() => Boolean, { nullable: true })
  hasChats?: boolean;
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
