import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as cookieSignature from 'cookie-signature';
import * as cookie from 'cookie';
import { Request } from 'express';
import { SessionData } from 'express-session';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { UserSessionService } from '../../userSession/userSession.service';

declare module 'express-session' {
  interface SessionData {
    passport: any;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private userSessionService: UserSessionService,
    private readonly configService: ConfigService,
  ) {
    const JWT_SECRET = configService.get('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          JwtStrategy.extractJWTFromCookie(req, authService, configService),
      ]),
      ignoreExpiration: true,
      secretOrKey: JWT_SECRET,
      passReqToCallback: true,
    });
  }

  private static extractJWTFromCookie(
    req: Request,
    authService: AuthService,
    configService: ConfigService,
  ): string | null {
    // req?.headers?.upgrade === 'websocket'
    // const token = req?.signedCookies?.token;
    if (req && authService && configService) {
      const headerCookies = req?.headers?.cookie;
      if (headerCookies) {
        const cookies = cookie.parse(headerCookies || '');
        const token = cookies?.token?.slice?.(2);
        const token_expires = cookies?.['token-expires'];
        if (token && token_expires) {
          const parts = token?.split?.('.');
          if (parts?.length === 4) {
            const COOKIE_SECRET = configService.get('COOKIE_SECRET');
            const unsignedToken = cookieSignature.unsign(
              token,
              COOKIE_SECRET,
            ) as string;
            if (unsignedToken) {
              return unsignedToken;
            }
            return null;
          }
          return null;
        }
        return null;
      }
      return null;
    }
    return null;
  }

  async validate(req: Request, payload: any) {
    if (req?.res && req?.user && req?.session && req?.sessionID) {
      const today = new Date();
      today.setMinutes(today.getMinutes() - 1);
      const currentTime = Math.floor(today.getTime() / 1000);
      if (
        payload &&
        !Number.isNaN(payload?.exp) &&
        payload?.exp < currentTime
      ) {
        const { newAccessToken, reAuthenticatedUser } =
          await this.authService.refreshToken(payload, req?.res);
        if (newAccessToken && reAuthenticatedUser) {
          const JWT_SECRET = this.configService.get('JWT_SECRET');
          const { payload: Payload } = await this.authService.verifyToken(
            newAccessToken,
            JWT_SECRET,
          );
          if (Payload) {
            req.user = reAuthenticatedUser;
          }
        }
      }
    } else {
      const user = await this.userService.findOneById(String(payload?._id));
      const session = await this.userSessionService.findOneById(
        payload?.sessionID,
      );
      const User = {
        ...user,
        authTokens: session?.session?.passport?.user?.authTokens,
        deviceDetails: session?.session?.passport?.user?.deviceDetails,
      };
      req.user = User;
      req.sessionID = session?._id;
    }
    return req?.user;
  }
}
