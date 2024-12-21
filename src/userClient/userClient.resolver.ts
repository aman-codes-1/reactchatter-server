import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { UserInput } from '../user/dto/user.input';
import { UserSessionInput } from './dto/userClient.input';
import {
  SessionClientsData,
  ClientsData,
  UserClient,
} from './models/userClient.model';
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
  @Query(() => ClientsData)
  async activeClients(@Args('input') input: UserInput): Promise<ClientsData> {
    const { userId } = input;
    const activeClients =
      await this.userClientService.findAllActiveClients(userId);
    return activeClients;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => SessionClientsData, {
    filter: (payload, variables) => {
      const updatedSessionID = payload?.OnSessionActiveClients?.sessionID;
      const subscribedSessionID = variables?.input?.sessionID;
      return updatedSessionID === subscribedSessionID;
    },
  })
  OnSessionActiveClients(@Args('input') input: UserSessionInput) {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnSessionActiveClients',
    );
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => ClientsData)
  OnActiveClients() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnActiveClients');
  }
}
