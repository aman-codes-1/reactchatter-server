import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, Max, Min } from 'class-validator';

@ArgsType()
export class MessageArgs {
  @Field(() => Int)
  @Min(1)
  @Max(50)
  limit = 25;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  after?: string;
}
