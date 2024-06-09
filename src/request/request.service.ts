import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from '../user/user.schema';
import { PaginatedRequest, Request } from './models/request.model';
import { Request as RequestSchema, RequestDocument } from './request.schema';
import { CreateRequestInput, UpdateRequestInput } from './dto/request.input';
import { RequestArgs } from './dto/request.args';
import { FriendService } from '../friend/friend.service';
import {
  Friend as FriendSchema,
  FriendDocument,
} from '../friend/friend.schema';
import { pubSub as friendPubSub } from '../friend/friend.resolver';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(RequestSchema.name)
    private RequestModel: Model<RequestDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(FriendSchema.name) private FriendModel: Model<FriendDocument>,
    private friendService: FriendService,
  ) {
    //
  }

  async findOneById(requestId: string): Promise<Request> {
    const requestObjectId = new ObjectId(requestId);
    const request = await this.RequestModel.aggregate([
      {
        $match: { _id: requestObjectId },
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
                _id: '$_id',
                __v: '$__v',
                name: '$name',
                email: '$email',
                email_verified: '$email_verified',
                picture: '$picture',
                given_name: '$given_name',
                family_name: '$family_name',
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
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      { $limit: 1 },
    ]);
    if (!request?.length) {
      throw new BadRequestException('Friend Request not found');
    }
    return request?.[0];
  }

  async create(data: CreateRequestInput): Promise<Request> {
    const { userId, sendToEmail } = data;
    const userObjectId = new ObjectId(userId);
    const user = await this.UserModel.findOne({
      email: sendToEmail,
    }).lean();
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const { _id } = user;
    const _idObjectId = new ObjectId(String(_id));
    if (userObjectId.equals(_idObjectId)) {
      throw new BadRequestException(
        'Please send a friend request to a different user.',
      );
    }
    const duplicateFriend = await this.FriendModel.findOne({
      members: {
        $all: [
          {
            $elemMatch: {
              _id: _idObjectId,
            },
          },
          {
            $elemMatch: {
              _id: userObjectId,
            },
          },
        ],
      },
    }).lean();
    const duplicatePendingRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
        { status: 'pending' },
      ],
    }).lean();
    const duplicateAcceptedRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
        { status: 'accepted' },
      ],
    }).lean();
    const duplicatePendingRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
        { status: 'pending' },
      ],
    }).lean();
    const duplicateAcceptedRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
        { status: 'accepted' },
      ],
    }).lean();
    if (duplicatePendingRequestSent) {
      throw new BadRequestException('Friend Request already sent.');
    }
    if (duplicatePendingRequestReceived) {
      throw new BadRequestException(
        'You already have a pending request from this user.',
      );
    }
    if (
      duplicateFriend ||
      (duplicateAcceptedRequestSent && duplicateFriend) ||
      (duplicateAcceptedRequestReceived && duplicateFriend)
    ) {
      throw new BadRequestException('Already a Friend.');
    }
    const members = [userObjectId, _idObjectId].map((id, idx) => ({
      _id: id,
      hasSent: idx === 0,
    }));
    const newRequest = new this.RequestModel({
      members,
      status: 'pending',
    });
    const savedRequest = await newRequest.save();
    const { _id: requestId } = savedRequest.toObject();
    const request = await this.findOneById(String(requestId));
    return request || savedRequest.toObject();
  }

  async findOneByIdAndUpdate(data: UpdateRequestInput): Promise<Request> {
    const { requestId, status } = data;
    const request = await this.findOneById(requestId);
    const { members } = request;
    const memberIds = members?.map((member) => member?._id);
    const [id1, id2] = memberIds;
    const id1ObjectId = new ObjectId(id1);
    const id2ObjectId = new ObjectId(id2);
    const duplicateFriend = await this.FriendModel.findOne({
      $and: [
        { members: { $elemMatch: { _id: id1ObjectId } } },
        { members: { $elemMatch: { _id: id2ObjectId } } },
        { isFriend: true },
      ],
    }).lean();
    if (duplicateFriend) {
      throw new BadRequestException('Already a Friend.');
    }
    const { _id } = await this.RequestModel.findByIdAndUpdate(
      { _id: requestId },
      { $set: { status } },
      { new: true },
    ).lean();
    const updatedRequest = await this.findOneById(String(_id));
    const { status: updatedRequestStatus } = updatedRequest;
    if (updatedRequestStatus === 'accepted') {
      const newFriend = await this.friendService.create(request);
      friendPubSub.publish('OnFriendAdded', {
        OnFriendAdded: {
          friend: newFriend,
        },
      });
    }
    return updatedRequest;
  }

  async findAllPending(
    userId: string,
    args: RequestArgs,
  ): Promise<PaginatedRequest> {
    const { limit, skip } = args;
    const userObjectId = new ObjectId(userId);
    const pendingRequests = await this.RequestModel.aggregate([
      {
        $match: {
          $and: [
            { status: 'pending' },
            {
              members: { $elemMatch: { _id: userObjectId, hasSent: false } },
            },
          ],
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
                _id: '$_id',
                __v: '$__v',
                name: '$name',
                email: '$email',
                email_verified: '$email_verified',
                picture: '$picture',
                given_name: '$given_name',
                family_name: '$family_name',
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
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      {
        $facet: {
          data: [
            { $limit: limit },
            { $skip: skip },
            { $sort: { createdAt: -1 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);
    const res = pendingRequests?.[0];
    return {
      data: res?.data,
      totalCount: res?.totalCount?.some((count: any) =>
        Object.prototype.hasOwnProperty.call(count, 'count'),
      )
        ? res?.totalCount?.[0]?.count
        : 0,
    };
  }

  async findAllSent(
    userId: string,
    args: RequestArgs,
  ): Promise<PaginatedRequest> {
    const { limit, skip } = args;
    const userObjectId = new ObjectId(userId);
    const sentRequests = await this.RequestModel.aggregate([
      {
        $match: {
          $and: [
            { status: 'pending' },
            {
              members: { $elemMatch: { _id: userObjectId, hasSent: true } },
            },
          ],
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
                _id: '$_id',
                __v: '$__v',
                name: '$name',
                email: '$email',
                email_verified: '$email_verified',
                picture: '$picture',
                given_name: '$given_name',
                family_name: '$family_name',
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
          status: { $first: '$status' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          __v: { $first: '$__v' },
          members: { $push: '$members' },
        },
      },
      {
        $facet: {
          data: [
            { $limit: limit },
            { $skip: skip },
            { $sort: { createdAt: -1 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);
    const res = sentRequests?.[0];
    return {
      data: res?.data,
      totalCount: res?.totalCount?.some((count: any) =>
        Object.prototype.hasOwnProperty.call(count, 'count'),
      )
        ? res?.totalCount?.[0]?.count
        : 0,
    };
  }

  async remove(requestId: string): Promise<boolean> {
    return true;
  }
}
