import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { FriendArgs } from './dto/friend.args';
import { FriendInput, FriendsInput } from './dto/friend.input';
import { Friend, FriendData } from './models/friend.model';
import { Friend as FriendSchema } from './friend.schema';
import { FriendService } from './friend.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

export const pubSub = new PubSub();

@Resolver(() => Friend)
export class FriendResolver {
  constructor(private readonly friendService: FriendService) {
    //
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Friend)
  async friend(@Args('input') input: FriendInput): Promise<FriendSchema> {
    const { friendId } = input;
    const friend = await this.friendService.findOneById(friendId);
    return friend;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Friend])
  async friends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<FriendSchema[]> {
    const { userId } = input;
    const friends = await this.friendService.findAll(userId, args);
    return friends;
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Friend])
  async otherFriends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<FriendSchema[]> {
    const { userId } = input;
    const otherFriends = await this.friendService.findAllOtherFriends(
      userId,
      args,
    );
    return otherFriends;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async removeFriend(@Args('id') id: string) {
    return this.friendService.remove(id);
  }

  @UseGuards(GqlAuthGuard)
  @Subscription(() => FriendData)
  OnFriendAdded() {
    return pubSub.asyncIterator('OnFriendAdded');
  }
}
