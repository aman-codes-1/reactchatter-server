import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { FriendArgs } from './dto/friend.args';
import { Friend as FriendSchema, FriendDocument } from './friend.schema';
import { Request } from '../request/request.schema';

@Injectable()
export class FriendService {
  constructor(
    @InjectModel(FriendSchema.name) private FriendModel: Model<FriendDocument>,
  ) {
    //
  }

  async findOneById(friendId: string): Promise<FriendSchema> {
    const friendObjectId = new ObjectId(friendId);
    const friend = await this.FriendModel.aggregate([
      { $match: { _id: friendObjectId } },
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
                _id: 1,
                name: 1,
                email: 1,
                email_verified: 1,
                picture: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'memberDetails',
        },
      },
      {
        $unwind: '$memberDetails',
      },
      {
        $addFields: {
          'members.memberDetails': '$memberDetails',
        },
      },
      {
        $group: {
          _id: '$_id',
          isFriend: { $first: '$isFriend' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          members: { $push: '$members' },
        },
      },
      { $limit: 1 },
    ]);
    if (!friend?.length) {
      throw new BadRequestException('Friend not found.');
    }
    return friend?.[0];
  }

  async create(data: Request): Promise<FriendSchema> {
    const { members } = data;
    const Members = members.map((member) => ({
      _id: new ObjectId(member?._id),
      hasAdded: member?.hasSent,
    }));
    const newFriend = new this.FriendModel({
      members: Members,
      isFriend: true,
    });
    const savedFriend = await newFriend.save();
    const { _id: friendId } = savedFriend.toObject();
    const friend = await this.findOneById(String(friendId));
    return friend || savedFriend.toObject();
  }

  async findAll(userId: string, args: FriendArgs): Promise<FriendSchema[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, skip } = args;
    const friends = await this.FriendModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$isFriend', true] },
              { $in: [userObjectId, '$members._id'] },
            ],
          },
        },
      },
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
                _id: 1,
                name: 1,
                email: 1,
                email_verified: 1,
                picture: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'memberDetails',
        },
      },
      {
        $unwind: '$memberDetails',
      },
      {
        $addFields: {
          'members.memberDetails': '$memberDetails',
        },
      },
      {
        $group: {
          _id: '$_id',
          isFriend: { $first: '$isFriend' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          members: { $push: '$members' },
        },
      },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ]);
    return friends;
  }

  async findAllOtherFriends(
    userId: string,
    args: FriendArgs,
  ): Promise<FriendSchema[]> {
    const userObjectId = new ObjectId(userId);
    const { limit, skip } = args;
    const otherFriends = await this.FriendModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$isFriend', true] },
              { $in: [userObjectId, '$members._id'] },
            ],
          },
        },
      },
      {
        $unwind: '$members',
      },
      {
        $match: {
          'members._id': { $ne: userObjectId },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members._id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                email_verified: 1,
                picture: 1,
                given_name: 1,
                family_name: 1,
              },
            },
          ],
          as: 'memberDetails',
        },
      },
      {
        $unwind: '$memberDetails',
      },
      {
        $addFields: {
          'members.memberDetails': '$memberDetails',
        },
      },
      {
        $lookup: {
          from: 'chats',
          let: { friendId: '$members._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$friendId', '$members._id'] },
                    { $in: [userObjectId, '$members._id'] },
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
        $match: {
          chatsWithFriend: { $size: 0 },
        },
      },
      {
        $group: {
          _id: '$_id',
          isFriend: { $first: '$isFriend' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } },
    ]);
    return otherFriends;
  }

  async remove(friendId: string): Promise<boolean> {
    return true;
  }
}
