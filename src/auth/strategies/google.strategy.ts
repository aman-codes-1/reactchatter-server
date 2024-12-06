import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  GoogleCallbackParameters,
  Profile,
  Strategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { UserDocument } from '../../user/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const GOOGLE_CLIENT_ID = configService.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = configService.get('GOOGLE_CLIENT_SECRET');
    const SERVER_URL = configService.get('SERVER_URL');

    super(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/api/auth/google/redirect`,
        scope: ['profile', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        params: GoogleCallbackParameters,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        const { expires_in } = params || {};
        const expiresInMs = Number(expires_in) * 1000;
        const expiry_date = new Date().getTime() + expiresInMs;
        const tokens = {
          ...params,
          access_token: accessToken,
          refresh_token: refreshToken,
          expiry_date,
        };
        const user = {
          ...profile?._json,
          provider: profile?.provider,
          authTokens: tokens,
        } as unknown as UserDocument;
        const googleUser = await this.authService.validateUser(user);
        return done(null, googleUser);
      },
    );
  }

  async authenticate(req: any, options: any): Promise<void> {
    if (!options?.state) {
      options = { ...options, state: req?.params?.from };
    }

    try {
      super.authenticate(req, options);
    } catch (err) {
      throw new Error(`Authentication failed: ${err.message}`);
    }
  }

  authorizationParams(): object {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }
}
