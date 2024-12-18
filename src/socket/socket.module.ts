import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserClientModule } from '../userClient/userClient.module';

@Module({
  imports: [AuthModule, UserClientModule],
  providers: [SocketGateway],
})
export class SocketModule {}
