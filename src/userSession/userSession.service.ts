import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserSession as UserSessionSchema,
  UserSessionDocument,
} from './userSession.schema';
import { AuthTokens, UserSession } from './models/userSession.model';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectModel(UserSessionSchema.name)
    private UserSessionModel: Model<UserSessionDocument>,
  ) {
    //
  }

  async projectPipeline(): Promise<any> {
    return [
      {
        $project: {
          _id: 1,
          userId: '$session.passport.user._id',
          provider: '$session.passport.user.provider',
          authTokens: '$session.passport.user.authTokens',
          deviceDetails: '$session.passport.user.deviceDetails',
          expires: 1,
          lastModified: 1,
          lastActive: 1,
        },
      },
    ];
  }

  async userClientsPipeline(isActiveClients?: boolean): Promise<any> {
    return [
      {
        $lookup: {
          from: 'userClients',
          localField: 'userId',
          foreignField: 'userId',
          as: 'userClients',
        },
      },
      {
        $addFields: {
          clients: {
            $filter: {
              input: {
                $ifNull: [{ $arrayElemAt: ['$userClients.clients', 0] }, []],
              },
              as: 'client',
              cond: {
                $and: [
                  { $eq: ['$$client.sessionID', '$_id'] },
                  ...(isActiveClients !== undefined
                    ? [{ $eq: ['$$client.isClientActive', isActiveClients] }]
                    : []),
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          userClients: 0,
        },
      },
    ];
  }

  async findOneById(
    sessionID: string,
    isActiveClients?: boolean,
  ): Promise<UserSession> {
    const projectPipeline = await this.projectPipeline();
    const userClientsPipeline =
      await this.userClientsPipeline(!!isActiveClients);
    const session = await this.UserSessionModel.aggregate([
      {
        $match: {
          _id: sessionID,
        },
      },
      ...projectPipeline,
      ...userClientsPipeline,
    ])
      .cursor()
      .next();
    return session;
  }

  async findAll(
    userId: string,
    isActiveClients?: boolean,
  ): Promise<UserSession[]> {
    const userObjectId = new ObjectId(userId);
    const projectPipeline = await this.projectPipeline();
    const userClientsPipeline =
      await this.userClientsPipeline(!!isActiveClients);
    const sessions = await this.UserSessionModel.aggregate([
      {
        $match: {
          'session.passport.user._id': userObjectId,
        },
      },
      ...projectPipeline,
      ...userClientsPipeline,
    ]);
    return sessions;
  }

  async updateAuthTokens(
    sessionID: string,
    newAuthTokens: AuthTokens,
  ): Promise<UserSession> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $set: {
          'session.passport.user.authTokens': newAuthTokens,
        },
      },
      { new: true },
    ).lean();
    const session = await this.findOneById(updatedSession?._id);
    return session;
  }

  async updateLastActive(
    sessionID: string,
    lastActive: Date,
  ): Promise<UserSession> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      { $set: { lastActive } },
      { new: true },
    ).lean();
    const session = await this.findOneById(updatedSession?._id);
    return session;
  }
}
