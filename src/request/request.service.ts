import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { ObjectId } from 'mongodb';
import { RequestsData } from './models/request.model';
import { Request as RequestSchema, RequestDocument } from './request.schema';
import { CreateRequestInput, UpdateRequestInput } from './dto/request.input';
import { RequestArgs } from './dto/request.args';
import { UserService } from '../user/user.service';
import { FriendService } from '../friend/friend.service';
import { FriendDocument } from '../friend/friend.schema';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(RequestSchema.name)
    private RequestModel: Model<RequestDocument>,
    private userService: UserService,
    private friendService: FriendService,
  ) {
    //
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
          status: { $first: '$status' },
          members: { $push: '$members' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },
    ];
  }

  async findOneById(requestId: string): Promise<RequestDocument> {
    const requestObjectId = new ObjectId(requestId);
    const request = await this.RequestModel.aggregate([
      {
        $match: { _id: requestObjectId },
      },
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      { $limit: 1 },
    ])
      .cursor()
      .next();
    if (!request) {
      throw new BadRequestException('Friend Request not found.');
    }
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
    const duplicateFriend = await this.friendService.findOneByQuery({
      members: {
        $all: [
          { $elemMatch: { _id: id1ObjectId } },
          { $elemMatch: { _id: id2ObjectId } },
        ],
      },
      isActive: true,
    });
    let updatedRequest: RequestDocument;
    let newFriend: FriendDocument;
    let isError = false;
    if (duplicateFriend) {
      const { _id } = await this.RequestModel.findByIdAndUpdate(
        requestId,
        { $set: { status: status === 'accepted' ? 'rejected' : status } },
        { new: true },
      ).lean();
      updatedRequest = await this.findOneById(String(_id));
      isError = true;
    } else {
      const { _id } = await this.RequestModel.findByIdAndUpdate(
        requestId,
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
    const pendingRequest = await this.RequestModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId, hasSent: false } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          status: 'pending',
        },
      },
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      {
        $facet: {
          data: [{ $sort: { _id: -1 } }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ])
      .cursor()
      .next();
    const res = pendingRequest;
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
    const sentRequest = await this.RequestModel.aggregate([
      {
        $match: {
          members: { $elemMatch: { _id: userObjectId, hasSent: true } },
          ...(after ? { _id: { $gt: new ObjectId(after) } } : {}),
          status: 'pending',
        },
      },
      ...this.membersPipeline(),
      ...this.groupPipeline(),
      {
        $facet: {
          data: [{ $sort: { _id: -1 } }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ])
      .cursor()
      .next();
    const res = sentRequest;
    return {
      data: res?.data,
      totalCount: res?.totalCount?.some((count: any) =>
        Object.prototype.hasOwnProperty.call(count, 'count'),
      )
        ? res?.totalCount?.[0]?.count
        : 0,
    };
  }

  async create(data: CreateRequestInput): Promise<RequestDocument> {
    const { userId, sendToEmail } = data;
    const userObjectId = new ObjectId(userId);
    const { _id } = await this.userService.findOneByQuery({
      email: sendToEmail,
    });
    if (String(userId) === String(_id)) {
      throw new BadRequestException(
        'Please send a friend request to a different user.',
      );
    }
    const duplicateFriend = await this.friendService.findOneByQuery({
      members: {
        $all: [{ $elemMatch: { _id } }, { $elemMatch: { _id: userObjectId } }],
      },
      isActive: true,
    });
    const duplicateAcceptedRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
      ],
      status: 'accepted',
    }).lean();
    const duplicateAcceptedRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
      ],
      status: 'accepted',
    }).lean();
    if (
      duplicateFriend ||
      (duplicateAcceptedRequestSent && duplicateFriend) ||
      (duplicateAcceptedRequestReceived && duplicateFriend)
    ) {
      throw new BadRequestException('Already a Friend.');
    }
    const duplicatePendingRequestSent = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: false } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: true } } },
      ],
      status: 'pending',
    }).lean();
    if (duplicatePendingRequestSent) {
      throw new BadRequestException('Friend Request already sent.');
    }
    const duplicatePendingRequestReceived = await this.RequestModel.findOne({
      $and: [
        { members: { $elemMatch: { _id, hasSent: true } } },
        { members: { $elemMatch: { _id: userObjectId, hasSent: false } } },
      ],
      status: 'pending',
    }).lean();
    if (duplicatePendingRequestReceived) {
      throw new BadRequestException(
        'You already have a pending request from this user.',
      );
    }
    const members = [userObjectId, _id].map((id, idx) => ({
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
}
