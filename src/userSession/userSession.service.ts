import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActiveConnection,
  UserSession as UserSessionSchema,
  UserSessionDocument,
} from './userSession.schema';

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
    return updatedSession as UserSessionDocument;
  }

  async updateActiveConnection(
    sessionID: string,
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
    return updatedSession as UserSessionDocument;
  }

  async removeActiveConnection(
    sessionID: string,
    clientId: string,
  ): Promise<UserSessionDocument> {
    const updatedSession = await this.UserSessionModel.findByIdAndUpdate(
      sessionID,
      {
        $pull: { activeConnections: { clientId } },
      },
      { new: true },
    ).lean();
    return updatedSession as UserSessionDocument;
  }
}
