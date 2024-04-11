import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from '../user/user.schema';
import { Request } from './models/request.model';
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
    @InjectModel(Request.name) private RequestModel: Model<RequestDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(FriendSchema.name) private FriendModel: Model<FriendDocument>,
    private friendService: FriendService,
  ) {
    //
  }

  async create(data: CreateRequestInput): Promise<Request> {
    const { sentByUserId, sendToEmail } = data;
    const sentByUserObjectId = new ObjectId(sentByUserId);
    const user = await this.UserModel.findOne({
      email: sendToEmail,
    }).lean();
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const { _id } = (user as any) || {};
    const _idObjectId = new ObjectId(_id);
    const duplicateRequestSent = await this.RequestModel.findOne({
      $and: [{ sentToUserId: _id }, { sentByUserId: sentByUserObjectId }],
      $or: [{ status: 'pending' }, { status: 'accepted' }],
    }).lean();
    const duplicateRequestReceived = await this.RequestModel.findOne({
      $and: [{ sentToUserId: sentByUserObjectId }, { sentByUserId: _id }],
      $or: [{ status: 'pending' }, { status: 'accepted' }],
    }).lean();
    if (sentByUserObjectId.equals(_idObjectId)) {
      throw new BadRequestException(
        'Please send a friend request to a different user.',
      );
    }
    if (duplicateRequestSent) {
      const { status } = duplicateRequestSent;
      if (status === 'accepted') {
        throw new BadRequestException('Already a Friend.');
      } else {
        throw new BadRequestException('Friend Request already sent.');
      }
    }
    if (duplicateRequestReceived) {
      const { status } = duplicateRequestReceived;
      if (status === 'accepted') {
        throw new BadRequestException('Already a Friend.');
      } else {
        throw new BadRequestException(
          'You already have a pending request from this user.',
        );
      }
    }
    const newRequest = new this.RequestModel({
      sentByUserId: sentByUserObjectId,
      sentToUserId: _idObjectId,
      status: 'pending',
    });
    const savedRequest = await newRequest.save();
    return savedRequest.toObject();
  }

  async findOneById(requestId: string): Promise<RequestSchema> {
    const request = await this.RequestModel.findById(requestId).lean();
    if (!request) {
      throw new BadRequestException('Friend Request not found');
    }
    return request;
  }

  async findOneByIdAndUpdate(data: UpdateRequestInput): Promise<any> {
    const { requestId, status } = data;
    const request = await this.findOneById(requestId);
    const { sentByUserId, sentToUserId } = request;
    const sentByUserObjectId = new ObjectId(sentByUserId);
    const sentToUserObjectId = new ObjectId(sentToUserId);
    const duplicateFriend = await this.FriendModel.find({
      $and: [
        {
          $and: [
            { members: { $elemMatch: { _id: sentByUserObjectId } } },
            { members: { $elemMatch: { _id: sentToUserObjectId } } },
          ],
        },
        { isFriend: true },
      ],
    }).lean();
    if (duplicateFriend?.length) {
      throw new BadRequestException('Already a Friend.');
    }
    const updatedRequest = await this.RequestModel.findByIdAndUpdate(
      { _id: requestId },
      { $set: { status } },
      { new: true },
    ).lean();
    if (status === 'accepted') {
      const newFriend = await this.friendService.create(request);
      friendPubSub.publish('OnFriendAdded', {
        OnFriendAdded: {
          friend: newFriend,
        },
      });
    }
    return updatedRequest;
  }

  async findAll(sentByUserId: string, args: RequestArgs): Promise<Request[]> {
    const { limit, skip } = args;
    const sentByUserObjectId = new ObjectId(sentByUserId);
    const receivedByUsers = await this.RequestModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$status', 'pending'] },
              { $eq: ['$sentToUserId', sentByUserObjectId] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$sentByUserId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId'],
                },
              },
            },
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
                locale: '$locale',
              },
            },
          ],
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]);
    return receivedByUsers;
  }

  async findAllSent(
    sentByUserId: string,
    args: RequestArgs,
  ): Promise<Request[]> {
    const { limit, skip } = args;
    const sentByUserObjectId = new ObjectId(sentByUserId);
    const sentToUsers = await this.RequestModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$status', 'pending'] },
              { $eq: ['$sentByUserId', sentByUserObjectId] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$sentToUserId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId'],
                },
              },
            },
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
                locale: '$locale',
              },
            },
          ],
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
        },
      },
      { $limit: limit },
      { $skip: skip },
    ]);
    return sentToUsers;
  }

  async remove(requestId: string): Promise<boolean> {
    return true;
  }
}
