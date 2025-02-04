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

  userClientsPipeline(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'userClients',
          localField: 'session.passport.user._id',
          foreignField: 'userId',
          as: 'userClients',
        },
      },
      {
        $unwind: {
          path: '$userClients',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          activeSessionIds: {
            $ifNull: ['$userClients.clients.sessionID', []],
          },
        },
      },
      {
        $match: {
          $expr: { $not: { $in: ['$_id', '$activeSessionIds'] } },
        },
      },
    ];
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
      ...this.projectPipeline(),
    ])
      .cursor()
      .next();
    return session;
  }

  async findAll(userId: string): Promise<UserSession[]> {
    const userObjectId = new ObjectId(userId);
    const sessions = await this.UserSessionModel.aggregate([
      {
        $match: {
          'session.passport.user._id': userObjectId,
        },
      },
      ...this.projectPipeline(),
    ]);
    return sessions;
  }

  async findAllInactive(userId: string): Promise<UserSession[]> {
    const userObjectId = new ObjectId(userId);
    const inactiveSessions = await this.UserSessionModel.aggregate([
      {
        $match: {
          'session.passport.user._id': userObjectId,
        },
      },
      ...this.userClientsPipeline(),
      ...this.projectPipeline(),
    ]);
    return inactiveSessions;
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
