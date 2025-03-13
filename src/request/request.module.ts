import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './request.schema';
import { RequestResolver } from './request.resolver';
import { RequestService } from './request.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { UserClientModule } from '../userClient/userClient.module';
import { FriendModule } from '../friend/friend.module';

@Module({
  imports: [
    AuthModule,
    SharedModule,
    UserModule,
    UserClientModule,
    FriendModule,
    MongooseModule.forFeature([
      {
        name: Request.name,
        schema: RequestSchema,
        collection: 'requests',
      },
    ]),
  ],
  providers: [RequestResolver, RequestService],
  exports: [RequestService],
})
export class RequestModule {}
