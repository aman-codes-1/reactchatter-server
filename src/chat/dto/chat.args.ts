import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class ChatArgs {
  @Field(() => Int)
  @Min(1)
  @Max(50)
  limit = 25;

  @Field(() => Int)
  @Min(0)
  skip = 0;
}
