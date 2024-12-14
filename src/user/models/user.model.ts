import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'OnlineStatusObject' })
export class OnlineStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => Float)
  lastSeen: number;
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

  @Field(() => String, { nullable: true })
  email_verified?: boolean;

  @Field(() => String, { nullable: true })
  given_name?: string;

  @Field(() => String, { nullable: true })
  family_name?: string;

  @Field(() => String, { nullable: true })
  provider?: string;
}
