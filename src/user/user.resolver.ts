import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserInput } from './dto/user.input';
import { User } from './models/user.model';
import { UserService } from './user.service';
import { UserDocument } from './user.schema';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async user(@Args('input') input: UserInput): Promise<UserDocument> {
    const { userId } = input;
    const user = await this.userService.findOneById(userId);
    return user;
  }
}
