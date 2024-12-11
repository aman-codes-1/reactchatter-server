import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { FriendArgs } from './dto/friend.args';
import { Friend as FriendSchema, FriendDocument } from './friend.schema';
import { RequestDocument } from '../request/request.schema';

@Injectable()
export class FriendService {
  constructor(
    @InjectModel(FriendSchema.name) private FriendModel: Model<FriendDocument>,
  ) {
    //
  }

  async groupPipeline(): Promise<any> {
    return [
      {
        $group: {
          _id: '$_id',
          isActive: { $first: '$isActive' },
          type: { $first: '$type' },
          members: { $push: '$members' },
          hasChats: { $first: '$hasChats' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
      {
        $addFields: {
          type: 'friend',
        },
      },
    ];
  }

  async hasChatsPipeline(userObjectId: ObjectId): Promise<any> {
    return [
      {
        $set: {
          filteredMembers: {
            $filter: {
              input: '$members',
              as: 'member',
              cond: { $ne: ['$$member._id', userObjectId] },
            },
          },
        },
      },
      { $unwind: '$filteredMembers' },
      {
        $lookup: {
          from: 'chats',
          let: { friendId: '$filteredMembers._id', userId: userObjectId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$friendId', '$members._id'] },
                    { $in: ['$$userId', '$members._id'] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
            {
              $project: { _id: 1 },
            },
          ],
          as: 'chatsWithFriend',
        },
      },
      {
        $addFields: {
          hasChats: { $gt: [{ $size: '$chatsWithFriend' }, 0] },
        },
      },
    ];
  }

  async membersPipeline(): Promise<any> {
    return [
      {
        $unwind: '$members',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members._id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                name: 1,
                picture: 1,
                email: 1,
                email_verified: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'userDetails',
        },
      },
      {
        $set: {
          members: {
            $mergeObjects: ['$members', { $arrayElemAt: ['$userDetails', 0] }],
          },
        },
      },
    ];
  }

  async findOneByQuery(
    findQuery: FilterQuery<FriendDocument>,
  ): Promise<FriendDocument> {
    const friend = await this.FriendModel.findOne(findQuery).lean();
    if (!friend) {
      throw new BadRequestException('Friend not found.');
    }
    return friend as FriendDocument;
  }

  async findOneById(friendId: string, userId: string): Promise<FriendDocument> {
    const friendObjectId = new ObjectId(friendId);
    const userObjectId = new ObjectId(userId);
    const hasChatsPipeline = await this.hasChatsPipeline(userObjectId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const friends = await this.FriendModel.aggregate([
      { $match: { _id: friendObjectId, isActive: true } },
      ...hasChatsPipeline,
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ]);
    if (!friends?.length) {
      throw new BadRequestException('Friend not found.');
    }
    return friends?.[0];
  }

  async create(data: RequestDocument, userId: string): Promise<FriendDocument> {
    const { members } = data;
    const Members = members.map((member) => ({
      _id: new ObjectId(member?._id),
      hasAdded: String(member?._id) === userId,
    }));
    const newFriend = new this.FriendModel({
      members: Members,
    });
    const savedFriend = (await newFriend.save()).toObject();
    const { _id: friendId } = savedFriend;
    const friend = await this.findOneById(String(friendId), userId);
    return friend;
  }

  async findAll(userId: string, args: FriendArgs): Promise<FriendDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const hasChatsPipeline = await this.hasChatsPipeline(userObjectId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const friends = await this.FriendModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...hasChatsPipeline,
      ...membersPipeline,
      ...groupPipeline,
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]);
    return friends;
  }

  async findAllOtherFriends(
    userId: string,
    args: FriendArgs,
  ): Promise<FriendDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const hasChatsPipeline = await this.hasChatsPipeline(userObjectId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const otherFriends = await this.FriendModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...hasChatsPipeline,
      ...membersPipeline,
      {
        $match: {
          chatsWithFriend: { $size: 0 },
        },
      },
      ...groupPipeline,
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]);
    return otherFriends;
  }

  async remove(friendId: string): Promise<boolean> {
    return true;
  }
}
