import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { UserInput } from '../user/dto/user.input';
import { UserSessionInput } from './dto/userSession.input';
import {
  SessionActiveConnectionsData,
  UserActiveConnectionsData,
  UserSession,
} from './models/userSession.model';
import { UserSessionService } from './userSession.service';
import { UserSessionDocument } from './userSession.schema';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserSession)
export class UserSessionResolver {
  constructor(
    private readonly userSessionService: UserSessionService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserSession)
  async userSession(
    @Args('input') input: UserSessionInput,
  ): Promise<UserSessionDocument> {
    const { sessionID } = input;
    const session = await this.userSessionService.findOneById(sessionID);
    return session;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => SessionActiveConnectionsData, {
    filter: (payload, variables) => {
      const updatedSessionID = payload?.OnSessionActiveConnections?._id;
      const subscribedSessionID = variables?.input?.sessionID;
      return updatedSessionID === subscribedSessionID;
    },
  })
  OnSessionActiveConnections(@Args('input') input: UserSessionInput) {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnSessionActiveConnections',
    );
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserActiveConnectionsData, {
    filter: (payload, variables) => {
      const updatedUserId = payload?.OnUserActiveConnections?.userId;
      const subscribedUserId = variables?.input?.userId;
      return String(updatedUserId) === subscribedUserId;
    },
  })
  OnUserActiveConnections(@Args('input') input: UserInput) {
    return this.pubSubService.pubSubInstance.asyncIterator(
      'OnUserActiveConnections',
    );
  }
}
