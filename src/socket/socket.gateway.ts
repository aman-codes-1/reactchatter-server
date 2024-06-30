import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor() {
    //
  }

  public connectedUsers: Map<string, any> = new Map();

  public clientId: any;

  @WebSocketServer() server: Server;

  handleConnection(client: any) {
    const clientId = client?.id;
    this.clientId = clientId;
    const { auth: user } = client.handshake;
    const userId = user?._id;
    if (userId) {
      this.server.emit('connection', { clientId });
      this.connectedUsers.set(clientId, user);
      console.log(
        `User ${user?.email} is ${user?.isOnline === false ? 'offline' : 'online'}.`,
      );
    } else {
      console.error('userId is undefined');
    }
    console.log(this.connectedUsers.size);
  }

  handleDisconnect(client: Socket) {
    const clientId = client?.id;
    this.clientId = clientId;
    const user = this.connectedUsers.get(clientId);
    if (user) {
      console.log(`User ${user?.email} disconnected.`);
      this.connectedUsers.delete(clientId);
    }
    console.log(this.connectedUsers.size);
  }
}
