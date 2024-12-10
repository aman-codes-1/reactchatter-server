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
// import { pubSub as authPubSub } from '../auth/auth.resolver';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userSessionService: UserSessionService) {
    //
  }

  public clientId: any;

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const { id: clientId, handshake } = client || {};
    this.clientId = clientId;
    const { auth } = handshake || {};
    const { sessionID, onlineStatus } = auth || {};

    if (!sessionID || !onlineStatus) {
      client.disconnect();
      return;
    }

    const { isOnline, lastSeen } = onlineStatus || {};

    const activeConnection = {
      clientId,
      isClientActive: isOnline || false,
      lastActive: lastSeen || Date.now(),
    };

    await this.userSessionService.addActiveConnection(
      sessionID,
      activeConnection,
    );

    // authPubSub.publish('OnUserUpdated', {
    //   OnUserUpdated: {
    //     auth: {
    //       ...updatedUser,
    //       onlineStatus: {
    //         ...updatedUser?.onlineStatus,
    //         isOnline,
    //       },
    //     },
    //   },
    // });
  }

  async handleDisconnect(client: Socket) {
    const { id: clientId, handshake } = client || {};
    this.clientId = clientId;
    const { auth } = handshake || {};
    const { sessionID } = auth || {};

    if (!sessionID) return;

    await this.userSessionService.removeActiveConnection(sessionID, clientId);
  }

  @SubscribeMessage('updateUserOnlineStatus')
  async handleStatusUpdate(@MessageBody() payload: any) {
    const { sessionID, onlineStatus } = payload || {};

    if (!sessionID || !onlineStatus) return;

    const { isOnline, lastSeen } = onlineStatus || {};

    const activeConnection = {
      clientId: this.clientId,
      isClientActive: isOnline || false,
      lastActive: lastSeen || Date.now(),
    };

    await this.userSessionService.updateActiveConnection(
      sessionID,
      activeConnection,
    );

    // authPubSub.publish('OnUserUpdated', {
    //   OnUserUpdated: {
    //     auth: {
    //       ...updatedUser,
    //       onlineStatus: {
    //         ...updatedUser?.onlineStatus,
    //         isOnline,
    //       },
    //     },
    //   },
    // });
  }
}
