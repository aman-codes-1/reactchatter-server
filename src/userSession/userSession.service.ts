import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  ActiveConnection,
  UserSession as UserSessionSchema,
  UserSessionDocument,
} from './userSession.schema';
import { pubSub as userPubSub } from '../user/user.resolver';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectModel(UserSessionSchema.name)
    private UserSessionModel: Model<UserSessionDocument>,
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

  async findUserOnlineStatus(userId: string, lastActive: number): Promise<any> {
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
      {
        $sort: { 'onlineStatus.lastSeen': -1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (!users?.length) {
      return {
        userId,
        onlineStatus: {
          isOnline: false,
          lastSeen: lastActive || Date.now(),
        },
      };
    }

    return users?.[0];
  }

  async updateAuthTokens(
    sessionID: string,
    newAuthTokens: any,
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
    _id: string,
    activeConnection: ActiveConnection,
  ): Promise<UserSessionDocument> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $set: { lastActive: activeConnection?.lastActive },
        $addToSet: { activeConnections: activeConnection },
      },
      { new: true },
    ).lean();

    const userOnlineStatus = await this.findUserOnlineStatus(
      _id,
      updatedSession?.lastActive,
    );

    userPubSub.publish('OnUserOnlineStatusUpdated', {
      OnUserOnlineStatusUpdated: userOnlineStatus,
    });

    return updatedSession as UserSessionDocument;
  }

  async updateActiveConnection(
    sessionID: string,
    _id: string,
    activeConnection: ActiveConnection,
  ): Promise<UserSessionDocument> {
    const { clientId } = activeConnection || {};
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
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
    ).lean();

    const userOnlineStatus = await this.findUserOnlineStatus(
      _id,
      updatedSession?.lastActive,
    );

    userPubSub.publish('OnUserOnlineStatusUpdated', {
      OnUserOnlineStatusUpdated: userOnlineStatus,
    });

    return updatedSession as UserSessionDocument;
  }

  async removeActiveConnection(
    sessionID: string,
    _id: string,
    clientId: string,
  ): Promise<UserSessionDocument> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $pull: { activeConnections: { clientId } },
      },
      { new: true },
    ).lean();

    const userOnlineStatus = await this.findUserOnlineStatus(
      _id,
      updatedSession?.lastActive,
    );

    userPubSub.publish('OnUserOnlineStatusUpdated', {
      OnUserOnlineStatusUpdated: userOnlineStatus,
    });

    return updatedSession as UserSessionDocument;
  }
}
