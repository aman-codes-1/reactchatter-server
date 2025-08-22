import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { UserSessionInput, UserSessionsInput } from './dto/userSession.input';
import { UserSessionData, UserSession } from './models/userSession.model';
import { UserSessionService } from './userSession.service';
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
  ): Promise<UserSession> {
    const { sessionID } = input;
    const userSession = await this.userSessionService.findOneById(sessionID);
    return userSession;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserSession])
  async userSessions(
    @Args('input') input: UserSessionsInput,
  ): Promise<UserSession[]> {
    const { userId } = input;
    const userSessions = await this.userSessionService.findAll(userId);
    return userSessions;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserSession])
  async userSessionsActive(
    @Args('input') input: UserSessionsInput,
  ): Promise<UserSession[]> {
    const { userId } = input;
    const userSessionsActive = await this.userSessionService.findAll(
      userId,
      'active',
    );
    return userSessionsActive;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserSession])
  async userSessionsInactive(
    @Args('input') input: UserSessionsInput,
  ): Promise<UserSession[]> {
    const { userId } = input;
    const userSessionsInactive = await this.userSessionService.findAll(
      userId,
      'inactive',
    );
    return userSessionsInactive;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => UserSessionData, {
    filter: (payload, variables) => {
      const updatedSessionID = payload?.OnSessionUpdated?.session?._id;
      const subscribedSessionID = variables?.input?.sessionID;
      return updatedSessionID === subscribedSessionID;
    },
  })
  OnSessionUpdated(@Args('input') input: UserSessionInput) {
    return this.pubSubService.pubSubInstance.asyncIterator('OnSessionUpdated');
  }
}
