import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { FriendArgs } from './dto/friend.args';
import { FriendInput, FriendsInput } from './dto/friend.input';
import { Friend, FriendData } from './models/friend.model';
import { FriendService } from './friend.service';
import { FriendDocument } from './friend.schema';
import { PubSubService } from '../shared/pubSub.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Friend)
export class FriendResolver {
  constructor(
    private readonly friendService: FriendService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Friend)
  async friend(@Args('input') input: FriendInput): Promise<FriendDocument> {
    const { friendId, userId } = input;
    const friend = await this.friendService.findOneById(friendId, userId);
    return friend;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Friend])
  async allFriends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<FriendDocument[]> {
    const { userId } = input;
    const allFriends = await this.friendService.findAll(userId, args);
    return allFriends;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Friend])
  async friends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<FriendDocument[]> {
    const { userId } = input;
    const newFriends = await this.friendService.findAllNew(userId, args);
    return newFriends;
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => FriendData)
  OnFriendAdded() {
    return this.pubSubService.pubSubInstance.asyncIterator('OnFriendAdded');
  }
}
