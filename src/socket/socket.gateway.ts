import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserSessionService } from '../userSession/userSession.service';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userSessionService: UserSessionService) {
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

    const activeConnection = {
      clientId,
      isClientActive: true,
      lastActive: new Date(),
    };

    await this.userSessionService.addActiveConnection(
      sessionID,
      _id,
      activeConnection,
    );
  }

  async handleDisconnect(client: Socket) {
    const { id: clientId, handshake } = client || {};
    this.clientId = clientId;
    const { auth } = handshake || {};
    const { _id, sessionID } = auth || {};

    if (!_id || !sessionID) return;

    await this.userSessionService.removeActiveConnection(
      sessionID,
      _id,
      clientId,
    );
  }

  @SubscribeMessage('updateUserOnlineStatus')
  async handleStatusUpdate(@MessageBody() payload: any) {
    const { _id, sessionID, onlineStatus } = payload || {};

    if (!_id || !sessionID || !onlineStatus) return;

    const { isOnline, lastSeen } = onlineStatus || {};

    const activeConnection = {
      clientId: this.clientId,
      isClientActive: isOnline ?? false,
      lastActive: new Date(lastSeen || Date.now()),
    };

    await this.userSessionService.updateActiveConnection(
      sessionID,
      _id,
      activeConnection,
    );
  }
}
