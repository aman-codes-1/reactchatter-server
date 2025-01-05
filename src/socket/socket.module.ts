import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserClientModule } from '../userClient/userClient.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [AuthModule, UserClientModule, MessageModule],
  providers: [SocketGateway],
})
export class SocketModule {}
