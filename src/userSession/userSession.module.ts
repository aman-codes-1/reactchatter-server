import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from './userSession.schema';
import { UserSessionService } from './userSession.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserSession.name,
        schema: UserSessionSchema,
        collection: 'userSessions',
      },
    ]),
  ],
  providers: [UserSessionService],
  exports: [UserSessionService],
})
export class UserSessionModule {}
