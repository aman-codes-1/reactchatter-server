import { Field, ObjectType } from '@nestjs/graphql';

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
