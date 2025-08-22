import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'UserSessionInput' })
export class UserSessionInput {
  @Field(() => String)
  sessionID: string;
}

@InputType({ description: 'UserSessionsInput' })
export class UserSessionsInput {
  @Field(() => String)
  userId: string;
}
