import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class ChatArgs {
  @Field((type) => Int)
  @Min(1)
  @Max(50)
  limit = 25;

  @Field((type) => Int)
  @Min(0)
  skip = 0;
}
