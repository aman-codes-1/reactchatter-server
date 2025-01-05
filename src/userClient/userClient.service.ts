import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserClient as UserClientSchema,
  UserClientDocument,
} from './userClient.schema';
import { Client } from './models/userClient.model';
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

  async findAll(userId: string): Promise<any> {
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
        },
      },
    ])
      .cursor()
      .next();

    return clients;
  }

  async findAllActiveInactive(
    userId: string,
    isActiveClients: boolean,
  ): Promise<any> {
    const userObjectId = new ObjectId(userId);
    const activeClients = await this.UserClientModel.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          filteredClients: {
            $filter: {
              input: { $ifNull: ['$clients', []] },
              as: 'client',
              cond: { $eq: ['$$client.isClientActive', isActiveClients] },
            },
          },
          lastActive: 1,
        },
      },
      {
        $project: {
          userId: 1,
          clients: '$filteredClients',
          onlineStatus: {
            isOnline: { $gt: [{ $size: '$filteredClients' }, 0] },
            lastSeen: '$lastActive',
          },
        },
      },
    ])
      .cursor()
      .next();

    return activeClients;
  }

  async sendClients(sessionID: string, userId: string): Promise<any> {
    const userSession = await this.userSessionService.findOneById(
      sessionID,
      true,
    );

    await this.pubSubService.pubSubInstance.publish('OnSessionUpdated', {
      OnSessionUpdated: {
        session: userSession,
      },
    });

    const activeClients = await this.findAllActiveInactive(userId, true);

    await this.pubSubService.pubSubInstance.publish('OnClientsUpdated', {
      OnClientsUpdated: activeClients,
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

    await this.userSessionService.updateLastActive(sessionID, lastActive);

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }

  async updateClient(
    userId: string,
    client: Client,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const { _id, sessionID, lastActive } = client || {};
    await this.UserClientModel.updateOne(
      { userId: userObjectId },
      {
        $set: {
          lastActive,
          'clients.$[element]': client,
        },
      },
      {
        arrayFilters: [{ 'element._id': _id }],
      },
    );

    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $unset: {
          'clients.$[element].isServer': '',
        },
      },
      {
        new: true,
        arrayFilters: [{ 'element._id': _id }],
      },
    ).lean()) as UserClientDocument;

    await this.UserClientModel.updateOne(
      { userId: userObjectId },
      {
        $pull: {
          clients: { isServer: { $exists: true } },
        },
      },
    );

    await this.userSessionService.updateLastActive(sessionID, lastActive);

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }

  async removeClient(
    userId: string,
    client: Client,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const { _id, sessionID } = client || {};
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $pull: { clients: { _id } },
      },
      { new: true },
    ).lean()) as UserClientDocument;

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }
}
