import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../user/user.schema';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: UserDocument, done: any) {
    const { _id } = user || {};
    return _id ? done(null, { _id }) : done(null, null);
  }

  async deserializeUser(user: UserDocument, done: any) {
    const { _id } = user || {};
    const User = await this.authService.findOneById(String(_id));
    return User ? done(null, User) : done(null, null);
  }
}
