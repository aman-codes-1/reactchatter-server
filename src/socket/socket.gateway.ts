import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserClientService } from '../userClient/userClient.service';
import { MessageService } from '../message/message.service';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private userClientService: UserClientService,
    private messageService: MessageService,
  ) {
    //
  }

  public clientId: string;

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const { id, handshake } = client || {};
    this.clientId = id;
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) {
      client.disconnect();
      return;
    }

    const Client = {
      _id: this.clientId,
      sessionID,
      isServer: true,
    };

    await this.userClientService.addClient(_id, Client);
  }

  async handleDisconnect(client: Socket) {
    const { id, handshake } = client || {};
    this.clientId = id;
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) return;

    const Client = {
      _id: this.clientId,
      sessionID,
    };

    await this.userClientService.removeClient(_id, Client);

    const sessionQueueName = `session_${sessionID}_queue`;
    const userQueueName = `user_${_id}_queue`;

    await this.messageService.stopWorker(sessionQueueName);
    await this.messageService.stopWorker(userQueueName);
  }

  @SubscribeMessage('updateUserOnlineStatus')
  async handleStatusUpdate(@MessageBody() payload: any) {
    const { _id, sessionID, onlineStatus } = payload || {};

    if (!_id || !sessionID || !onlineStatus) return;

    const { isOnline, lastSeen } = onlineStatus || {};

    const Client = {
      _id: this.clientId,
      sessionID,
      isClientActive: isOnline ?? false,
      lastActive: new Date(lastSeen || Date.now()),
    };

    await this.userClientService.updateClient(_id, Client);

    const sessionQueueName = `session_${sessionID}_queue`;
    const userQueueName = `user_${_id}_queue`;

    if (isOnline) {
      // to do: check if user queue exists with same jobId
      await this.messageService.startWorker(sessionQueueName);
      await this.messageService.startWorker(userQueueName);
    } else {
      await this.messageService.stopWorker(sessionQueueName);
      await this.messageService.stopWorker(userQueueName);
    }
  }
}
