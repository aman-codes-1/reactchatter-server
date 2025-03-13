import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'UserClientInput' })
export class UserClientInput {
  @Field(() => String)
  userId: string;
}

@InputType({ description: 'MarkNotificationsReadInput' })
export class MarkNotificationsReadInput extends UserClientInput {
  @Field(() => Boolean)
  value: boolean;
}
