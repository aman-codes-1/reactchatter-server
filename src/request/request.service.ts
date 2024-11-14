import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from '../user/user.schema';
import { Request, RequestsData } from './models/request.model';
import { Request as RequestSchema, RequestDocument } from './request.schema';
import { CreateRequestInput, UpdateRequestInput } from './dto/request.input';
import { RequestArgs } from './dto/request.args';
import { FriendService } from '../friend/friend.service';
import { Friend } from '../friend/models/friend.model';
import {
  Friend as FriendSchema,
  FriendDocument,
} from '../friend/friend.schema';

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

  async groupPipeline(): Promise<any> {
    return [
      {
        $group: {
          _id: '$_id',
          status: { $first: '$status' },
          members: { $push: '$members' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
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

  async findOneById(requestId: string): Promise<Request> {
    const requestObjectId = new ObjectId(requestId);
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const request = await this.RequestModel.aggregate([
      {
        $match: { _id: requestObjectId },
      },
      ...membersPipeline,
      ...groupPipeline,
      { $limit: 1 },
    ]);
    if (!request?.length) {
      throw new BadRequestException('Friend Request not found.');
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
          { $elemMatch: { _id: _idObjectId } },
          { $elemMatch: { _id: userObjectId } },
        ],
      },
      isActive: true,
    }).lean();
    const duplicatePendingRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
      ],
      status: 'pending',
    }).lean();
    const duplicateAcceptedRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
      ],
      status: 'accepted',
    }).lean();
    const duplicatePendingRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
      ],
      status: 'pending',
    }).lean();
    const duplicateAcceptedRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
      ],
      status: 'accepted',
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
    const savedRequest = (await newRequest.save()).toObject();
    const { _id: requestId } = savedRequest;
    const request = await this.findOneById(String(requestId));
    return request;
  }

  async findOneByIdAndUpdate(data: UpdateRequestInput): Promise<any> {
    const { userId, requestId, status } = data;
    const request = await this.findOneById(requestId);
    const { members } = request;
    const memberIds = members?.map((member) => member?._id);
    const [id1, id2] = memberIds;
    const id1ObjectId = new ObjectId(id1);
    const id2ObjectId = new ObjectId(id2);
    const duplicateFriend = await this.FriendModel.findOne({
      members: {
        $all: [
          { $elemMatch: { _id: id1ObjectId } },
          { $elemMatch: { _id: id2ObjectId } },
        ],
      },
      isActive: true,
    }).lean();
    let updatedRequest: Request;
    let newFriend: Friend;
    let isError = false;
    if (duplicateFriend) {
      const { _id } = await this.RequestModel.findByIdAndUpdate(
        { _id: requestId },
        { $set: { status: status === 'accepted' ? 'rejected' : status } },
        { new: true },
      ).lean();
      updatedRequest = await this.findOneById(String(_id));
      isError = true;
    } else {
      const { _id } = await this.RequestModel.findByIdAndUpdate(
        { _id: requestId },
        { $set: { status } },
        { new: true },
      ).lean();
      updatedRequest = await this.findOneById(String(_id));
      if (updatedRequest?.status === 'accepted') {
        newFriend = await this.friendService.create(request, userId);
      }
    }
    return { updatedRequest, newFriend, isError };
  }

  async findAllPending(
    userId: string,
    args: RequestArgs,
  ): Promise<RequestsData> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const pendingRequests = await this.RequestModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId, hasSent: false } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          status: 'pending',
        },
      },
      ...membersPipeline,
      ...groupPipeline,
      {
        $facet: {
          data: [{ $sort: { _id: -1 } }, { $limit: limit }],
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

  async findAllSent(userId: string, args: RequestArgs): Promise<RequestsData> {
    const userObjectId = new ObjectId(userId);
    const { limit, after } = args;
    const membersPipeline = await this.membersPipeline();
    const groupPipeline = await this.groupPipeline();
    const sentRequests = await this.RequestModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId, hasSent: true } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          status: 'pending',
        },
      },
      ...membersPipeline,
      ...groupPipeline,
      {
        $facet: {
          data: [{ $sort: { _id: -1 } }, { $limit: limit }],
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
