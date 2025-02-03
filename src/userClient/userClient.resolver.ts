import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { UserInput } from '../user/dto/user.input';
import { UserClient, UserOnlineStatus } from './models/userClient.model';
import { UserClientService } from './userClient.service';
import { UserClientDocument } from './userClient.schema';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserClient)
export class UserClientResolver {
  constructor(
    private readonly userClientService: UserClientService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserClient)
  async userClient(
    @Args('input') input: UserInput,
  ): Promise<UserClientDocument> {
    const { userId } = input;
    const userClient = await this.userClientService.findOneByUserId(userId);
    return userClient;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserOnlineStatus)
  async userOnlineStatus(
    @Args('input') input: UserInput,
  ): Promise<UserOnlineStatus> {
    const { userId } = input;
    const userOnlineStatus =
      await this.userClientService.findUserOnlineStatus(userId);
    return userOnlineStatus;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserOnlineStatus)
  OnUserOnlineStatus() {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnUserOnlineStatus',
    );
  }
}
