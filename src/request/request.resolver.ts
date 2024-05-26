import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { RequestArgs } from './dto/request.args';
import {
  CreateRequestInput,
  RequestInput,
  RequestsInput,
  UpdateRequestInput,
} from './dto/request.input';
import { PaginatedRequest, Request, RequestData } from './models/request.model';
import { RequestService } from './request.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

@Resolver(() => Request)
export class RequestResolver {
  constructor(private readonly requestService: RequestService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Request)
  async pendingRequest(@Args('input') input: RequestInput): Promise<Request> {
    const { requestId } = input;
    const request = await this.requestService.findOneById(requestId);
    return request;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedRequest)
  async pendingRequests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<PaginatedRequest> {
    const { userId } = input;
    const pendingRequests = await this.requestService.findAllPending(
      userId,
      args,
    );
    return pendingRequests;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedRequest)
  async sentRequests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<PaginatedRequest> {
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
    const updatedRequest =
      await this.requestService.findOneByIdAndUpdate(input);
    pubSub.publish('OnRequestUpdated', {
      OnRequestUpdated: {
        request: updatedRequest,
      },
    });
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
