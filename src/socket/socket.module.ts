import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserClientModule } from '../userClient/userClient.module';
import { UserSessionModule } from '../userSession/userSession.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [AuthModule, UserClientModule, UserSessionModule, MessageModule],
  providers: [SocketGateway],
})
export class SocketModule {}
