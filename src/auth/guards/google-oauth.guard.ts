import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    const from = (request.query.state as string)?.replace(/\@/g, '/');
    request.params.from = from;
    if (result) {
      await super.logIn(request);
    }
    return result;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const response = context.switchToHttp().getResponse() as Response;
      response.redirect('/api/auth/google/cancel');
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
