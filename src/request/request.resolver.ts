import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { RequestArgs } from './dto/request.args';
import {
  CreateRequestInput,
  RequestInput,
  RequestsInput,
  UpdateRequestInput,
} from './dto/request.input';
import { Request, RequestData } from './models/request.model';
import { RequestService } from './request.service';

export const pubSub = new PubSub();

@Resolver(() => Request)
export class RequestResolver {
  constructor(private readonly requestService: RequestService) {
    //
  }

  @Query(() => Request)
  async request(@Args('input') input: RequestInput): Promise<Request> {
    const { requestId } = input;
    const request = await this.requestService.findOneById(requestId);
    return request as unknown as Request;
  }

  @Query(() => [Request])
  async requests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<Request[]> {
    const { sentByUserId } = input;
    const requests = await this.requestService.findAll(sentByUserId, args);
    return requests;
  }

  @Query(() => [Request])
  async sentRequests(
    @Args('input') input: RequestsInput,
    @Args() args: RequestArgs,
  ): Promise<Request[]> {
    const { sentByUserId } = input;
    const requests = await this.requestService.findAllSent(sentByUserId, args);
    return requests;
  }

  @Mutation(() => Request)
  async createRequest(@Args('input') input: CreateRequestInput) {
    const newRequest = await this.requestService.create(input);
    pubSub.publish('OnFriendAdded', {
      OnRequestAdded: {
        request: newRequest,
      },
    });
    return newRequest;
  }

  @Mutation(() => Request)
  async updateRequest(@Args('input') input: UpdateRequestInput) {
    const updatedRequest =
      await this.requestService.findOneByIdAndUpdate(input);
    return updatedRequest;
  }

  @Mutation(() => Boolean)
  async removeRequest(@Args('id') id: string) {
    return this.requestService.remove(id);
  }

  @Subscription(() => RequestData)
  OnRequestAdded() {
    return pubSub.asyncIterator('OnRequestAdded');
  }
}
