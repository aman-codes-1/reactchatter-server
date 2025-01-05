import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { UserInput } from '../user/dto/user.input';
import { ClientData, UserClient } from './models/userClient.model';
import { UserClientService } from './userClient.service';
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
  @Query(() => ClientData)
  async activeClients(@Args('input') input: UserInput): Promise<ClientData> {
    const { userId } = input;
    const activeClients = await this.userClientService.findAllActiveInactive(
      userId,
      true,
    );
    return activeClients;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ClientData)
  OnClientsUpdated() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnClientsUpdated');
  }
}
