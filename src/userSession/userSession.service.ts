import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
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

  userClientsPipeline(
    filterType: 'all' | 'active' | 'inactive' = 'all',
  ): PipelineStage[] {
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'userClients',
          localField: 'session.passport.user._id',
          foreignField: 'userId',
          as: 'userClientsData',
        },
      },
      {
        $addFields: {
          clients: {
            $filter: {
              input: {
                $ifNull: [
                  { $arrayElemAt: ['$userClientsData.clients', 0] },
                  [],
                ],
              },
              as: 'client',
              cond: { $eq: ['$$client.sessionID', '$_id'] },
            },
          },
        },
      },
      {
        $project: {
          userClientsData: 0,
        },
      },
    ];

    if (filterType === 'active') {
      pipeline.push({
        $match: {
          $expr: { $gt: [{ $size: '$clients' }, 0] },
        },
      });
    } else if (filterType === 'inactive') {
      pipeline.push({
        $match: {
          $expr: { $eq: [{ $size: '$clients' }, 0] },
        },
      });
    }

    return pipeline;
  }

  projectPipeline(): PipelineStage[] {
    return [
      {
        $project: {
          _id: 1,
          userId: '$session.passport.user._id',
          provider: '$session.passport.user.provider',
          authTokens: '$session.passport.user.authTokens',
          deviceDetails: '$session.passport.user.deviceDetails',
          clients: 1,
          expires: 1,
          lastModified: 1,
          lastActive: 1,
        },
      },
    ];
  }

  async findOneById(sessionID: string): Promise<UserSession> {
    const session = await this.UserSessionModel.aggregate([
      {
        $match: {
          _id: sessionID,
        },
      },
      ...this.userClientsPipeline(),
      ...this.projectPipeline(),
    ])
      .cursor()
      .next();
    return session;
  }

  async findAll(
    userId: string,
    clientsFilterType: 'all' | 'active' | 'inactive' = 'all',
  ): Promise<UserSession[]> {
    const userObjectId = new ObjectId(userId);
    const sessions = await this.UserSessionModel.aggregate([
      {
        $match: {
          'session.passport.user._id': userObjectId,
        },
      },
      ...this.userClientsPipeline(clientsFilterType),
      ...this.projectPipeline(),
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

  async removeStale(): Promise<void> {
    await this.UserSessionModel.deleteMany({ 'session.passport': {} });
  }
}
