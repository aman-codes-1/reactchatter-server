import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'LoginInput' })
export class LoginInput {
  @Field(() => String)
  code: string;
}
