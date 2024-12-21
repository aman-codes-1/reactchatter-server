import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  UserClient as UserClientSchema,
  UserClientDocument,
} from './userClient.schema';
import { Client } from './models/userClient.model';
import { PubSubService } from '../shared/pubSub.service';

@Injectable()
export class UserClientService {
  constructor(
    @InjectModel(UserClientSchema.name)
    private UserClientModel: Model<UserClientDocument>,
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

  async findAllActiveClients(userId: string): Promise<any> {
    const userObjectId = new ObjectId(userId);
    const activeClients = await this.UserClientModel.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $unwind: {
          path: '$clients',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          userId: { $first: '$userId' },
          allClients: { $push: '$clients' },
          lastActive: { $max: '$lastActive' },
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$userId',
          filteredClients: {
            $filter: {
              input: '$allClients',
              as: 'conn',
              cond: { $eq: ['$$conn.isClientActive', true] },
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

  async findAllSessionActiveClients(
    userId: string,
    sessionID: string,
  ): Promise<any> {
    const userObjectId = new ObjectId(userId);
    const sessionClients = await this.UserClientModel.aggregate([
      {
        $match: {
          userId: userObjectId,
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          sessionID,
          clients: {
            $filter: {
              input: '$clients',
              as: 'client',
              cond: {
                $and: [
                  { $eq: ['$$client.isClientActive', true] },
                  { $eq: ['$$client.sessionID', sessionID] },
                ],
              },
            },
          },
        },
      },
    ])
      .cursor()
      .next();

    return sessionClients;
  }

  async sendClients(sessionID: string, userId: string): Promise<any> {
    const sessionActiveClients = await this.findAllSessionActiveClients(
      userId,
      sessionID,
    );

    await this.pubSubService.pubSubInstance.publish('OnSessionActiveClients', {
      OnSessionActiveClients: sessionActiveClients,
    });

    // to do: deliver messages to all users
    // const userClients = await this.findAll(userId);

    const activeClients = await this.findAllActiveClients(userId);

    await this.pubSubService.pubSubInstance.publish('OnActiveClients', {
      OnActiveClients: activeClients,
    });
  }

  async addClient(
    sessionID: string,
    userId: string,
    client: Client,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: { lastActive: client?.lastActive },
        $addToSet: { clients: client },
      },
      { upsert: true, new: true },
    ).lean()) as UserClientDocument;

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }

  async updateClient(
    sessionID: string,
    userId: string,
    client: Client,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const { clientId } = client || {};
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          lastActive: client?.lastActive,
          'clients.$[element]': client,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'element.clientId': clientId }],
      },
    ).lean()) as UserClientDocument;

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }

  async removeClient(
    sessionID: string,
    userId: string,
    clientId: string,
  ): Promise<UserClientDocument> {
    const userObjectId = new ObjectId(userId);
    const updatedClient = (await this.UserClientModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $pull: { clients: { clientId } },
      },
      { new: true },
    ).lean()) as UserClientDocument;

    await this.sendClients(sessionID, userId);

    return updatedClient;
  }
}
