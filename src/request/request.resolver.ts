import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { RequestArgs } from './dto/request.args';
import {
  CreateRequestInput,
  RequestsInput,
  UpdateRequestInput,
} from './dto/request.input';
import { Request, RequestData, RequestsData } from './models/request.model';
import { RequestService } from './request.service';
import { RequestDocument } from './request.schema';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Request)
export class RequestResolver {
  constructor(
    private readonly requestService: RequestService,
    private readonly pubSubService: PubSubService,
  ) {
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
  ): Promise<RequestDocument> {
    const newRequest = await this.requestService.create(input);
    await this.pubSubService.pubSubInstance.publish('OnRequestAdded', {
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
  ): Promise<RequestDocument> {
    const { updatedRequest, newFriend, isError } =
      await this.requestService.findOneByIdAndUpdate(input);
    if (newFriend) {
      await this.pubSubService.pubSubInstance.publish('OnFriendAdded', {
        OnFriendAdded: {
          friend: newFriend,
        },
      });
    }
    await this.pubSubService.pubSubInstance.publish('OnRequestUpdated', {
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
  @Subscription(() => RequestData)
  OnRequestAdded() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnRequestAdded');
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => RequestData)
  OnRequestUpdated() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnRequestUpdated');
  }
}
