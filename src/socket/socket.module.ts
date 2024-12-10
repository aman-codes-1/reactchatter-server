import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserSessionModule } from '../userSession/userSession.module';

@Module({
  imports: [AuthModule, UserSessionModule],
  providers: [SocketGateway],
})
export class SocketModule {}
