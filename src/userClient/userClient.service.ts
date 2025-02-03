import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserClient as UserClientSchema,
  UserClientDocument,
} from './userClient.schema';
import { Client, UserOnlineStatus } from './models/userClient.model';
import { UserSessionService } from '../userSession/userSession.service';
import { PubSubService } from '../shared/pubSub.service';

@Injectable()
export class UserClientService {
  constructor(
    @InjectModel(UserClientSchema.name)
    private UserClientModel: Model<UserClientDocument>,
    private userSessionService: UserSessionService,
    private readonly pubSubService: PubSubService,
  ) {
    //
  }

  async findOneByUserId(userId: string): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const clients = await this.UserClientModel.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          clients: 1,
          lastActive: 1,
        },
      },
    ])
      .cursor()
      .next();

    return clients;
  }

  async findUserOnlineStatus(userId: string): Promise<UserOnlineStatus> {
    const userClient = await this.findOneByUserId(userId);
    const userOnlineStatus = {
      userId,
      onlineStatus: {
        isOnline: !!userClient?.clients?.length,
        lastSeen: userClient?.lastActive,
      },
    };
    return userOnlineStatus;
  }

  async sendClients(userId: string): Promise<void> {
    const userOnlineStatus = await this.findUserOnlineStatus(userId);

    await this.pubSubService.pubSubInstance.publish('OnUserOnlineStatus', {
      OnUserOnlineStatus: userOnlineStatus,
    });
  }

  async addClient(userId: string, client: Client): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const { sessionID, lastActive } = client || {};
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: { lastActive },
        $addToSet: { clients: client },
      },
      { upsert: true, new: true },
    ).lean()) as UserClientDocument;

    await Promise.all([
      this.userSessionService.updateLastActive(sessionID, lastActive),
      this.sendClients(userId),
      this.userSessionService.removeStale(),
    ]);

    return updatedClient;
  }

  async removeClient(
    userId: string,
    clientId: string,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $pull: { clients: { _id: clientId } },
      },
      { new: true },
    ).lean()) as UserClientDocument;

    await Promise.all([
      this.sendClients(userId),
      this.userSessionService.removeStale(),
    ]);

    return updatedClient;
  }
}
