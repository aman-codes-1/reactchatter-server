import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { RequestArgs } from './dto/request.args';
import {
  CreateRequestInput,
  RequestsInput,
  UpdateRequestInput,
} from './dto/request.input';
import { Request, RequestData, RequestsData } from './models/request.model';
import { RequestService } from './request.service';
import { pubSub as friendPubSub } from '../friend/friend.resolver';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

@Resolver(() => Request)
export class RequestResolver {
  constructor(private readonly requestService: RequestService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => RequestsData)
  async pendingRequests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<RequestsData> {
    const { userId } = input;
    const pendingRequests = await this.requestService.findAllPending(
      userId,
      args,
    );
    return pendingRequests;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => RequestsData)
  async sentRequests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<RequestsData> {
    const { userId } = input;
    const sentRequests = await this.requestService.findAllSent(userId, args);
    return sentRequests;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Request)
  async createRequest(
    @Args('input') input: CreateRequestInput,
  ): Promise<Request> {
    const newRequest = await this.requestService.create(input);
    pubSub.publish('OnRequestAdded', {
      OnRequestAdded: {
        request: newRequest,
      },
    });
    return newRequest;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Request)
  async updateRequest(
    @Args('input') input: UpdateRequestInput,
  ): Promise<Request> {
    const { updatedRequest, newFriend, isError } =
      await this.requestService.findOneByIdAndUpdate(input);
    if (newFriend) {
      friendPubSub.publish('OnFriendAdded', {
        OnFriendAdded: {
          friend: newFriend,
        },
      });
    }
    pubSub.publish('OnRequestUpdated', {
      OnRequestUpdated: {
        request: updatedRequest,
      },
    });
    if (isError) {
      const status =
        updatedRequest?.status === 'accepted'
          ? 'rejected'
          : updatedRequest?.status;
      const Status = status?.charAt(0)?.toUpperCase() + status?.slice(1);
      throw new BadRequestException(`Already a Friend. ${Status} Request.`);
    }
    return updatedRequest;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeRequest(@Args('id') id: string) {
    return this.requestService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => RequestData)
  OnRequestAdded() {
    return pubSub.asyncIterator('OnRequestAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => RequestData)
  OnRequestUpdated() {
    return pubSub.asyncIterator('OnRequestUpdated');
  }
}
