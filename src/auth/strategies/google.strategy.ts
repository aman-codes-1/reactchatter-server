import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import {
  GoogleCallbackParameters,
  Profile,
  Strategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { UAParser } from 'ua-parser-js';
import { UserService } from '../../user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private userService: UserService,
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
        passReqToCallback: true,
      },
      async (
        req: Request,
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
        };
        const userDetails = this.userService.getUserDetails(user);
        const otherDetails = {
          authTokens: tokens,
          deviceDetails: this.getDeviceDetails(req),
        };
        const validatedUser = await this.userService.validateUser(userDetails);
        if (validatedUser) {
          return done(null, {
            ...validatedUser,
            ...otherDetails,
          });
        }
        return done(null, {
          ...userDetails,
          ...otherDetails,
        });
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

  private browserNameMapping = {
    Chrome: 'Google Chrome',
    Firefox: 'Mozilla Firefox',
    Edge: 'Microsoft Edge',
    IE: 'Internet Explorer',
  };

  private getMappedBrowserName(browserName: string) {
    return this.browserNameMapping[browserName] || browserName;
  }

  private getDeviceDetails(req: Request) {
    const userAgentString = req?.headers?.['user-agent'] || '';
    const parserResults = new UAParser(userAgentString).getResult();
    const res = {
      ...parserResults,
      browser: {
        ...parserResults.browser,
        name: this.getMappedBrowserName(parserResults.browser.name),
      },
    };
    return res;
  }
}
