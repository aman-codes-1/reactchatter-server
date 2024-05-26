import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as cookieSignature from 'cookie-signature';
import * as cookie from 'cookie';
import { CookieOptions, Request, response } from 'express';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../user/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
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
            const JWT_SECRET = configService.get('JWT_SECRET');
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
    const today = new Date();
    today.setMinutes(today.getMinutes() - 1);
    const currentTime = Math.floor(today.getTime() / 1000);
    if (payload && !Number.isNaN(payload?.exp) && payload?.exp < currentTime) {
      const accessToken = await this.authService.refreshToken(
        payload,
        req?.res,
      );
      if (accessToken) {
        const JWT_SECRET = this.configService.get('JWT_SECRET');
        const { payload: Payload } = this.authService.verifyToken(
          accessToken,
          JWT_SECRET,
        );
        if (Payload) {
          return Payload;
        }
        throw new UnauthorizedException();
      }
      throw new UnauthorizedException();
    }
    return payload;
  }
}
