import { Field, InputType } from '@nestjs/graphql';
import { Types } from 'mongoose';

@InputType({ description: 'RequestInput' })
export class RequestInput {
  @Field(() => String)
  requestId: string;
}

@InputType({ description: 'RequestsInput' })
export class RequestsInput {
  @Field(() => String)
  sentByUserId: string;
}

@InputType({ description: 'CreateRequestInput' })
export class CreateRequestInput {
  @Field(() => String)
  sentByUserId: string;

  @Field(() => String)
  sendToEmail: string;
}

@InputType({ description: 'UpdateRequestInput' })
export class UpdateRequestInput {
  @Field(() => String)
  requestId: string;

  @Field(() => String)
  status: string;
}
