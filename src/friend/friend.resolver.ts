import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { FriendArgs } from './dto/friend.args';
import { FriendInput, FriendsInput } from './dto/friend.input';
import { Friend, FriendData } from './models/friend.model';
import { FriendService } from './friend.service';

export const pubSub = new PubSub();

@Resolver(() => Friend)
export class FriendResolver {
  constructor(private readonly friendService: FriendService) {
    //
  }

  @Query(() => Friend)
  async friend(@Args('input') input: FriendInput): Promise<Friend> {
    const { friendId } = input;
    const friend = await this.friendService.findOneById(friendId);
    return friend;
  }

  @Query(() => [Friend])
  async friends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<Friend[]> {
    const { userId } = input;
    const friends = await this.friendService.findAll(userId, args);
    return friends;
  }

  @Query(() => [Friend])
  async otherFriends(
    @Args('input') input: FriendsInput,
    @Args() args: FriendArgs,
  ): Promise<Friend[]> {
    const { userId } = input;
    const otherFriends = await this.friendService.findAllOtherFriends(
      userId,
      args,
    );
    return otherFriends;
  }

  @Mutation(() => Boolean)
  async removeFriend(@Args('id') id: string) {
    return this.friendService.remove(id);
  }

  @Subscription(() => FriendData)
  OnFriendAdded() {
    return pubSub.asyncIterator('OnFriendAdded');
  }
}
