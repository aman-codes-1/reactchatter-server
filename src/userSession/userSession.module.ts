import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from './userSession.schema';
import { UserSessionResolver } from './userSession.resolver';
import { UserSessionService } from './userSession.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SharedModule,
    MongooseModule.forFeature([
      {
        name: UserSession.name,
        schema: UserSessionSchema,
        collection: 'userSessions',
      },
    ]),
  ],
  providers: [UserSessionResolver, UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
