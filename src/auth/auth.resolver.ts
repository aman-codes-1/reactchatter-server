import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { UserInput } from './dto/auth.input';
import { User, UserData } from './models/auth.model';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async user(@Args('input') input: UserInput): Promise<User> {
    const { userId } = input;
    const user = await this.authService.findOneById(userId);
    return user as User;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserData, {
    filter: (payload, variables) => {
      const updatedUserId = payload?.OnUserUpdated.user?._id;
      const subscribedUserId = variables?.input?.userId;
      return String(updatedUserId) === subscribedUserId;
    },
  })
  OnUserUpdated(@Args('input') input: UserInput) {
    return pubSub.asyncIterator('OnUserUpdated');
  }
}
