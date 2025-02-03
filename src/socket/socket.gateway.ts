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
import { UserSessionService } from '../userSession/userSession.service';
import { MessageService } from '../message/message.service';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private userClientService: UserClientService,
    private userSessionService: UserSessionService,
    private messageService: MessageService,
  ) {
    //
  }

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const { id, handshake } = client || {};
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) {
      client.disconnect();
      return;
    }

    const Client = {
      _id: id,
      sessionID,
      lastActive: new Date(Date.now()),
    };

    await this.userClientService.addClient(_id, Client);

    const userSession = await this.userSessionService.findOneById(sessionID);

    if (userSession) {
      const sessionQueueName = `session_${sessionID}_queue`;
      await this.messageService.startWorker(sessionQueueName);
      // to do: check if user queue exists with same jobId and remove it
    } else {
      const userQueueName = `user_${_id}_queue`;
      await this.messageService.startWorker(userQueueName);
    }
  }

  async handleDisconnect(client: Socket) {
    const { id, handshake } = client || {};
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) return;

    await this.userClientService.removeClient(_id, id);

    const userSession = await this.userSessionService.findOneById(sessionID);

    if (userSession) {
      const sessionQueueName = `session_${sessionID}_queue`;
      await this.messageService.stopWorker(sessionQueueName);
    } else {
      const userQueueName = `user_${_id}_queue`;
      await this.messageService.stopWorker(userQueueName);
    }
  }
}
