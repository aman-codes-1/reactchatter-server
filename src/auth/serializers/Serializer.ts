import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UserService } from '../../user/user.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(user: any, done: any) {
    if (user?._id) {
      const { _id, provider, authTokens, deviceDetails } = user || {};
      const sessionData = { _id, provider, authTokens, deviceDetails };
      return done(null, sessionData);
    }
    return done(null, null);
  }

  async deserializeUser(payload: any, done: any) {
    if (payload) {
      const { _id } = payload || {};
      if (_id) {
        const user = await this.userService.findOneById(String(_id));
        const User = {
          ...payload,
          ...user,
        };
        return done(null, User);
      }
      return done(null, payload);
    }
    return done(null, null);
  }
}
