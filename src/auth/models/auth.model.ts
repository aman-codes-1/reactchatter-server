import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'ChatObject' })
export class Auth {
  @Field(() => String)
  access_token: string;
}
