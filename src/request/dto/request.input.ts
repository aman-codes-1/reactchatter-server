import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'RequestInput' })
export class RequestInput {
  @Field(() => String)
  requestId: string;
}

@InputType({ description: 'RequestsInput' })
export class RequestsInput {
  @Field(() => String)
  userId: string;
}

@InputType({ description: 'CreateRequestInput' })
export class CreateRequestInput extends RequestsInput {
  @Field(() => String)
  sendToEmail: string;
}

@InputType({ description: 'UpdateRequestInput' })
export class UpdateRequestInput extends RequestInput {
  @Field(() => String)
  status: string;
}
