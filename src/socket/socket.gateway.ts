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

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userClientService: UserClientService) {
    //
  }

  public clientId: string;

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const { id: clientId, handshake } = client || {};
    this.clientId = clientId;
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) {
      client.disconnect();
      return;
    }

    const Client = {
      clientId,
      sessionID,
      isClientActive: true,
      lastActive: new Date(),
    };

    await this.userClientService.addClient(sessionID, _id, Client);
  }

  async handleDisconnect(client: Socket) {
    const { id: clientId, handshake } = client || {};
    this.clientId = clientId;
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) return;

    await this.userClientService.removeClient(sessionID, _id, clientId);
  }

  @SubscribeMessage('updateUserOnlineStatus')
  async handleStatusUpdate(@MessageBody() payload: any) {
    const { _id, sessionID, onlineStatus } = payload || {};

    if (!_id || !sessionID || !onlineStatus) return;

    const { isOnline, lastSeen } = onlineStatus || {};

    const Client = {
      clientId: this.clientId,
      sessionID,
      isClientActive: isOnline ?? false,
      lastActive: new Date(lastSeen || Date.now()),
    };

    await this.userClientService.updateClient(sessionID, _id, Client);
  }
}
