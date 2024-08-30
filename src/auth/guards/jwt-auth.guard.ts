import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest() as Request;
      const response = context.switchToHttp().getResponse() as Response;
      this.authService.logout(request, response);
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
