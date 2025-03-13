import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
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

  hasChatsPipeline(onlyNewFriends = false): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'chats',
          let: { memberIds: '$members._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$isActive', true] },
                    { $setIsSubset: ['$$memberIds', '$members._id'] },
                  ],
                },
              },
            },
          ],
          as: 'chatMembers',
        },
      },
      {
        $addFields: {
          hasChats: { $gt: [{ $size: '$chatMembers' }, 0] },
        },
      },
      ...(onlyNewFriends
        ? [
            {
              $match: { hasChats: false },
            },
          ]
        : []),
      {
        $unset: 'chatMembers',
      },
    ];
  }

  membersPipeline(): PipelineStage[] {
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

  groupPipeline(): PipelineStage[] {
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

  async findOneByQuery(
    findQuery: FilterQuery<FriendDocument>,
  ): Promise<FriendDocument> {
    const friend = await this.FriendModel.findOne(findQuery).lean();
    return friend as FriendDocument;
  }

  async findOneById(friendId: string): Promise<FriendDocument> {
    const friendObjectId = new ObjectId(friendId);
    const friend = await this.FriendModel.aggregate([
      { $match: { _id: friendObjectId, isActive: true } },
      ...this.hasChatsPipeline(),
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      { $limit: 1 },
    ])
      .cursor()
      .next();
    if (!friend) {
      throw new BadRequestException('Friend not found.');
    }
    return friend;
  }

  async findAll(userId: string, args: FriendArgs): Promise<FriendDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const friends = await this.FriendModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...this.hasChatsPipeline(),
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]);
    return friends;
  }

  async findAllNew(
    userId: string,
    args: FriendArgs,
  ): Promise<FriendDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const friends = await this.FriendModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...this.hasChatsPipeline(true),
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      { $sort: { _id: -1 } },
      { $limit: limit },
    ]);
    return friends;
  }

  async findAllNewSorted(
    userId: string,
    args: FriendArgs,
  ): Promise<FriendDocument[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const friends = await this.FriendModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          isActive: true,
        },
      },
      ...this.hasChatsPipeline(true),
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      {
        $set: {
          sortedMembers: {
            $filter: {
              input: '$members',
              as: 'member',
              cond: { $ne: ['$$member._id', userObjectId] },
            },
          },
        },
      },
      {
        $unwind: '$sortedMembers',
      },
      { $sort: { 'sortedMembers.name': 1, _id: -1 } },
      { $unset: 'sortedMembers' },
      { $limit: limit },
    ]).collation({ locale: 'en', strength: 2 });
    return friends;
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
    const friend = await this.findOneById(String(friendId));
    return friend;
  }
}
