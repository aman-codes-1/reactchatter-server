import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
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
      { _id: sessionID },
      {
        $set: {
          'session.passport.user.authTokens': newAuthTokens,
        },
      },
      { upsert: true, new: true },
    ).lean();
    return updatedSession as UserSessionDocument;
  }
}
