import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import {
  UserClientInput,
  MarkNotificationsReadInput,
} from './dto/userClient.input';
import {
  UserClient,
  UserClientData,
  UserOnlineStatus,
} from './models/userClient.model';
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
    @Args('input') input: UserClientInput,
  ): Promise<UserClientDocument> {
    const { userId } = input;
    const userClient = await this.userClientService.findOneByUserId(userId);
    return userClient;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserOnlineStatus)
  async userOnlineStatus(
    @Args('input') input: UserClientInput,
  ): Promise<UserOnlineStatus> {
    const { userId } = input;
    const userOnlineStatus =
      await this.userClientService.findUserOnlineStatus(userId);
    return userOnlineStatus;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserClient)
  async shouldNotifyUser(
    @Args('input') input: MarkNotificationsReadInput,
  ): Promise<UserClientDocument> {
    const { userId, value } = input;
    const updatedUserClient = await this.userClientService.shouldNotifyUser(
      userId,
      value,
    );
    await this.pubSubService.pubSubInstance.publish('OnUserClientUpdated', {
      OnUserClientUpdated: {
        userClient: updatedUserClient,
      },
    });
    return updatedUserClient;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserOnlineStatus)
  OnUserOnlineStatus() {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnUserOnlineStatus',
    );
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserClientData)
  OnUserClientUpdated() {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnUserClientUpdated',
    );
  }
}
