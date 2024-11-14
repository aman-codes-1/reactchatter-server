import { ArgsType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, Min } from 'class-validator';

@ArgsType()
export class FriendArgs {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  limit?: number = 25;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  after?: string;
}
