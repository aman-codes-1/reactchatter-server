import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserSession as UserSessionSchema,
  UserSessionDocument,
} from './userSession.schema';
import { ActiveConnection, AuthTokens } from './models/userSession.model';
import { PubSubService } from '../shared/pubSub.service';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectModel(UserSessionSchema.name)
    private UserSessionModel: Model<UserSessionDocument>,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  async findOneById(sessionID: string): Promise<UserSessionDocument> {
    const session = await this.UserSessionModel.findById(sessionID);
    if (!session) {
      throw new BadRequestException('Session not found.');
    }
    return session;
  }

  async findSessionActiveConnections(
    sessionID: string,
  ): Promise<UserSessionDocument> {
    const activeConnections = await this.UserSessionModel.aggregate([
      {
        $match: {
          _id: sessionID,
        },
      },
      {
        $unwind: '$activeConnections',
      },
      {
        $match: {
          'activeConnections.isClientActive': true,
        },
      },
      {
        $group: {
          _id: '$_id',
          activeConnections: { $push: '$activeConnections' },
        },
      },
    ]);
    return activeConnections?.[0];
  }

  async findUserActiveConnections(
    userId: string,
    lastActive: Date,
  ): Promise<any> {
    const userObjectId = new ObjectId(userId);
    const users = await this.UserSessionModel.aggregate([
      {
        $match: {
          'session.passport.user._id': userObjectId,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$session.passport.user._id',
          onlineStatus: {
            isOnline: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ['$activeConnections', []] },
                      as: 'connection',
                      cond: { $eq: ['$$connection.isClientActive', true] },
                    },
                  },
                },
                0,
              ],
            },
            lastSeen: '$lastActive',
          },
        },
      },
    ]);

    if (!users?.length) {
      return {
        userId,
        onlineStatus: {
          isOnline: false,
          lastSeen: lastActive || new Date(),
        },
      };
    }

    return users?.[0];
  }

  async sendActiveConnections(
    updatedSession: UserSessionDocument,
    userId: string,
  ): Promise<any> {
    const sessionActiveConnections = await this.findSessionActiveConnections(
      updatedSession?._id,
    );

    await this.pubSubService.pubSubInstance.publish(
      'OnSessionActiveConnections',
      {
        OnSessionActiveConnections: sessionActiveConnections,
      },
    );

    const userActiveConnections = await this.findUserActiveConnections(
      userId,
      updatedSession?.lastActive,
    );

    await this.pubSubService.pubSubInstance.publish('OnUserActiveConnections', {
      OnUserActiveConnections: userActiveConnections,
    });
  }

  async updateAuthTokens(
    sessionID: string,
    newAuthTokens: AuthTokens,
  ): Promise<UserSessionDocument> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $set: {
          'session.passport.user.authTokens': newAuthTokens,
        },
      },
      { new: true },
    ).lean();
    return updatedSession as UserSessionDocument;
  }

  async addActiveConnection(
    sessionID: string,
    userId: string,
    activeConnection: ActiveConnection,
  ): Promise<UserSessionDocument> {
    const updatedSession = (await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $set: { lastActive: activeConnection?.lastActive },
        $addToSet: { activeConnections: activeConnection },
      },
      { new: true },
    ).lean()) as UserSessionDocument;

    await this.sendActiveConnections(updatedSession, userId);

    return updatedSession;
  }

  async updateActiveConnection(
    sessionID: string,
    userId: string,
    activeConnection: ActiveConnection,
  ): Promise<UserSessionDocument> {
    const { clientId } = activeConnection || {};
    const updatedSession = (await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $set: {
          lastActive: activeConnection?.lastActive,
          'activeConnections.$[element]': {
            ...activeConnection,
            clientId,
          },
        },
      },
      {
        new: true,
        arrayFilters: [{ 'element.clientId': clientId }],
      },
    ).lean()) as UserSessionDocument;

    await this.sendActiveConnections(updatedSession, userId);

    return updatedSession;
  }

  async removeActiveConnection(
    sessionID: string,
    userId: string,
    clientId: string,
  ): Promise<UserSessionDocument> {
    const updatedSession = (await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $pull: { activeConnections: { clientId } },
      },
      { new: true },
    ).lean()) as UserSessionDocument;

    await this.sendActiveConnections(updatedSession, userId);

    return updatedSession;
  }
}
