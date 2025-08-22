import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserClient, UserClientSchema } from './userClient.schema';
import { UserClientResolver } from './userClient.resolver';
import { UserClientService } from './userClient.service';
import { AuthModule } from '../auth/auth.module';
import { UserSessionModule } from '../userSession/userSession.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    UserSessionModule,
    SharedModule,
    MongooseModule.forFeature([
      {
        name: UserClient.name,
        schema: UserClientSchema,
        collection: 'userClients',
      },
    ]),
  ],
  providers: [UserClientResolver, UserClientService],
  exports: [UserClientService],
})
export class UserClientModule {}
