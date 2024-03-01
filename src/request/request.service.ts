import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from '../user/user.schema';
import { FriendService } from '../friend/friend.service';
import { Request, RequestDocument } from './request.schema';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(Request.name) private RequestModel: Model<RequestDocument>,
    private friendService: FriendService,
  ) {
    //
  }

  async sendRequest(requestData: { [key: string]: string }): Promise<Request> {
    const { sentByUserId, sendToEmail } = requestData || {};
    const sentByUserObjectId = new ObjectId(sentByUserId);
    const user = await this.UserModel.findOne({
      email: sendToEmail,
    }).lean();
    if (!user) {
      throw new BadRequestException('User not found.');
    } else {
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
      } else if (duplicateRequestSent) {
        const { status } = duplicateRequestSent;
        if (status === 'accepted') {
          throw new BadRequestException('Already a Friend.');
        } else {
          throw new BadRequestException('Friend Request already sent.');
        }
      } else if (duplicateRequestReceived) {
        const { status } = duplicateRequestReceived;
        if (status === 'accepted') {
          throw new BadRequestException('Already a Friend.');
        } else {
          throw new BadRequestException(
            'You already have a pending request from this user.',
          );
        }
      } else {
        const newRequest = new this.RequestModel({
          sentByUserId: sentByUserObjectId,
          sentToUserId: _idObjectId,
          status: 'pending',
        });
        await newRequest.save();
        return newRequest?._doc ? newRequest?._doc : newRequest;
      }
    }
  }

  async respondToRequest(requestData: {
    [key: string]: string;
  }): Promise<Request> {
    const { requestId, status } = requestData;
    const request = await this.RequestModel.findById(requestId);
    let newFriend: any = {};
    if (status === 'accepted') {
      newFriend = await this.friendService.addFriend(request);
    }
    const updatedRequest = await this.RequestModel.findByIdAndUpdate(
      { _id: requestId },
      { $set: { status } },
      { new: true },
    ).lean();
    return { ...updatedRequest, ...newFriend };
  }

  async sentRequests(requestData: {
    [key: string]: string;
  }): Promise<Request[]> {
    const { sentByUserId } = requestData || {};
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
          as: 'sentToUser',
        },
      },
      {
        $unwind: {
          path: '$sentToUser',
        },
      },
      { $project: { sentToUser: true } },
      // { $replaceRoot: { newRoot: "$sentToUser" } },
    ]);
    return sentToUsers;
  }

  async receiveRequests(requestData: {
    [key: string]: string;
  }): Promise<Request[]> {
    const { sentByUserId } = requestData || {};
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
          as: 'receivedByUser',
        },
      },
      {
        $unwind: {
          path: '$receivedByUser',
        },
      },
      { $project: { receivedByUser: true } },
      // { $replaceRoot: { newRoot: "$receivedByUser" } },
    ]);
    return receivedByUsers;
  }
}
