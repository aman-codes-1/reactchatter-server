import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'AuthInput' })
export class AuthInput {
  @Field(() => String)
  userId: string;
}
