import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'UserInput' })
export class UserInput {
  @Field(() => String)
  userId: string;
}
