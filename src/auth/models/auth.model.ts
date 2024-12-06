import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'OnlineStatusObject' })
class OnlineStatus {
  @Field(() => Boolean, { nullable: true })
  isOnline?: boolean;

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'UserObject' })
export class User {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  picture?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => Boolean, { nullable: true })
  email_verified?: boolean;

  @Field(() => String, { nullable: true })
  given_name?: string;

  @Field(() => String, { nullable: true })
  family_name?: string;

  @Field(() => OnlineStatus, { nullable: true })
  onlineStatus?: OnlineStatus;
}

@ObjectType({ description: 'UserDataObject' })
export class UserData {
  @Field(() => User)
  user: User;
}
