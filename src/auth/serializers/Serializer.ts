import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../user/user.schema';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: UserDocument, done: Function) {
    done(null, user);
  }

  async deserializeUser(user: UserDocument, done: Function) {
    const User = await this.authService.findOneById(String(user?._id));
    return User ? done(null, User) : done(null, null);
  }
}
