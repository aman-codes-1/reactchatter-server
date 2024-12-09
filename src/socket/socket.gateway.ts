import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';
// import { pubSub as authPubSub } from '../auth/auth.resolver';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private userService: UserService) {
    //
  }

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const { auth } = client.handshake;
    const { _id, onlineStatus } = auth || {};

    if (!_id || !onlineStatus) {
      client.disconnect();
      return;
    }

    // const { timestamp } = onlineStatus || {};
    // const isOnline = true;

    // const updatedUser = await this.userService.updateOnlineStatus(_id, {
    //   timestamp,
    // });

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
    const { auth } = client.handshake;
    const { _id, onlineStatus } = auth || {};

    if (!_id || !onlineStatus) return;

    // const { timestamp } = onlineStatus || {};

    // await this.userService.updateOnlineStatus(_id, {
    //   timestamp,
    // });
  }

  @SubscribeMessage('updateUserOnlineStatus')
  async handleStatusUpdate(@MessageBody() payload: any) {
    const { _id, onlineStatus } = payload || {};

    if (!_id || !onlineStatus) return;

    // const { isOnline, timestamp } = onlineStatus || {};

    // const updatedUser = await this.userService.updateOnlineStatus(_id, {
    //   timestamp,
    // });

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
