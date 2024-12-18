import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'UserSessionInput' })
export class UserSessionInput {
  @Field(() => String)
  sessionID: string;
}
