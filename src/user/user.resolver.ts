import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { UserInput } from './dto/user.input';
import { User, UserOnlineStatusData } from './models/user.model';
import { UserService } from './user.service';
import { UserDocument } from './user.schema';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

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

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserOnlineStatusData, {
    filter: (payload, variables) => {
      const updatedUserId = payload?.OnUserOnlineStatusUpdated.userId;
      const subscribedUserId = variables?.input?.userId;
      return String(updatedUserId) === subscribedUserId;
    },
  })
  OnUserOnlineStatusUpdated(@Args('input') input: UserInput) {
    return pubSub.asyncIterator('OnUserOnlineStatusUpdated');
  }
}
