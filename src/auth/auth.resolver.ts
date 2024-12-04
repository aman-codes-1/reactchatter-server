import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthInput } from './dto/auth.input';
import { Auth, AuthData } from './models/auth.model';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

@Resolver(() => Auth)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Auth)
  async auth(@Args('input') input: AuthInput): Promise<Auth> {
    const { userId } = input;
    const user = await this.authService.findOneById(userId);
    return user as unknown as Auth;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => AuthData, {
    filter: (payload, variables) => {
      const updatedUserId = payload?.OnUserUpdated.auth?._id;
      const subscribedUserId = variables?.input?.userId;
      return String(updatedUserId) === subscribedUserId;
    },
  })
  OnUserUpdated(@Args('input') input: AuthInput) {
    return pubSub.asyncIterator('OnUserUpdated');
  }
}
