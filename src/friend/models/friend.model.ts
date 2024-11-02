import { Field, ObjectType } from '@nestjs/graphql';
import { Auth } from '../../auth/models/auth.model';

@ObjectType({ description: 'FriendMemberObject' })
class Member {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasConfirmed: boolean;

  @Field(() => Auth, { nullable: true })
  memberDetails?: Auth;
}

@ObjectType({ description: 'FriendObject' })
export class Friend {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => [Member])
  members: Member[];

  @Field(() => Auth, { nullable: true })
  details?: Auth;

  @Field(() => Boolean, { nullable: true })
  hasChats?: boolean;
}

@ObjectType({ description: 'FriendDataObject' })
export class FriendData {
  @Field(() => Friend)
  friend: Friend;
}
