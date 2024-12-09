import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { CookieOptions, Request, Response } from 'express';
import { UserDocument } from '../user/user.schema';
import { UserService } from '../user/user.service';
import { UserSessionService } from '../userSession/userSession.service';

@Injectable()
export class AuthService {
  private JWT_SECRET: string;

  private JWT_EXPIRATION_TIME: string;

  private HTTP_ONLY_COOKIE: CookieOptions;

  private USERS_COOKIE: CookieOptions;

  private CLIENT_URL: string;

  private GOOGLE_CLIENT_ID: string;

  private GOOGLE_CLIENT_SECRET: string;

  private ENCRYPTION_SECRET: string;

  private oauth2Client: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private userService: UserService,
    private userSessionService: UserSessionService,
  ) {
    this.JWT_SECRET = configService.get('JWT_SECRET');
    this.JWT_EXPIRATION_TIME = configService.get('JWT_EXPIRATION_TIME');
    this.HTTP_ONLY_COOKIE = configService.get('HTTP_ONLY_COOKIE');
    this.USERS_COOKIE = configService.get('USERS_COOKIE');
    this.CLIENT_URL = configService.get('CLIENT_URL');
    this.GOOGLE_CLIENT_ID = configService.get('GOOGLE_CLIENT_ID');
    this.GOOGLE_CLIENT_SECRET = configService.get('GOOGLE_CLIENT_SECRET');
    this.ENCRYPTION_SECRET = configService.get('ENCRYPTION_SECRET');

    this.oauth2Client = new OAuth2Client({
      clientId: this.GOOGLE_CLIENT_ID,
      clientSecret: this.GOOGLE_CLIENT_SECRET,
      redirectUri: this.CLIENT_URL,
    });
  }

  getTextEncoding(text: string) {
    const enc = new TextEncoder();
    return enc.encode(text);
  }

  async getCryptoKey(key: string) {
    const encodedKey = new TextEncoder().encode(key);
    const res = await crypto.subtle.importKey(
      'raw',
      encodedKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
    return res;
  }

  decodeBase64ToUint8Array(data: string) {
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid Base64 input');
      }
      const binaryString = atob(data);
      return new Uint8Array(
        Array.from(binaryString).map((char) => char.charCodeAt(0)),
      );
    } catch (error) {
      console.error('Failed to decode Base64 string:', error);
      throw error;
    }
  }

  async encrypt(data: string) {
    const encoded = this.getTextEncoding(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.getCryptoKey(this.ENCRYPTION_SECRET);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    );
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    const res = btoa(String.fromCharCode(...combined));
    return res;
  }

  async decrypt(data: string) {
    const combined = this.decodeBase64ToUint8Array(data);
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    const key = await this.getCryptoKey(this.ENCRYPTION_SECRET);
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData,
    );
    const res = new TextDecoder().decode(decryptedData);
    return res;
  }

  async login(user: any, response: Response): Promise<any> {
    const {
      authTokens: { expires_in = 0, expiry_date = 0 } = {},
      deviceDetails,
      iat,
      exp,
      ...payload
    } = user || {};
    const options = {
      secret: this.JWT_SECRET,
      expiresIn: Number(expires_in || this.JWT_EXPIRATION_TIME),
    };
    const accessToken = await this.jwtService.signAsync(payload, options);
    if (accessToken && expiry_date) {
      response?.cookie('token', accessToken, this.HTTP_ONLY_COOKIE);
      response?.cookie(
        'token-expires',
        expiry_date?.toString(),
        this.USERS_COOKIE,
      );
      return {
        accessToken,
      };
    }
    throw new UnauthorizedException();
  }

  async refreshToken(payload: any, response: Response): Promise<any> {
    if (payload?.sessionID) {
      const session = await this.userSessionService.findOneById(
        payload?.sessionID,
      );
      const authTokens = session?.session?.passport?.user?.authTokens;
      if (authTokens) {
        if (payload?.provider === 'google') {
          const res = await this.googleRefreshToken(
            payload,
            authTokens,
            response,
          );
          return res;
        }
      }
    }
    return {
      newAccessToken: '',
      reAuthenticatedUser: null,
    };
  }

  async googleRefreshToken(
    payload: any,
    authTokens: any,
    response: Response,
  ): Promise<any> {
    let refreshToken: string;
    let newAccessToken: string;
    let reAuthenticatedUser: any;

    try {
      const { refresh_token = '' } = authTokens || {};

      refreshToken = refresh_token;

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { res: { data = {} } = {} } =
        await this.oauth2Client.getAccessToken();

      if (!data) {
        throw new UnauthorizedException('Refresh token is revoked or expired.');
      }

      this.oauth2Client.setCredentials(data);

      const newAuthTokens = {
        ...authTokens,
        ...data,
      };

      const updatedSession = await this.userSessionService.updateAuthTokens(
        payload?.sessionID,
        newAuthTokens,
      );

      const user = await this.userService.findOneById(String(payload?._id));

      reAuthenticatedUser = {
        ...user,
        authTokens: updatedSession?.session?.passport?.user?.authTokens,
        deviceDetails: updatedSession?.session?.passport?.user?.deviceDetails,
      };

      const { accessToken } = await this.login(reAuthenticatedUser, response);

      if (accessToken) {
        newAccessToken = accessToken;
      }
    } catch (err) {
      throw new UnauthorizedException('Refresh token is revoked or expired.');
    }

    return {
      newAccessToken,
      reAuthenticatedUser,
    };
  }

  async verifyToken(token: string, secret: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });
      return { payload: payload || null };
    } catch (err) {
      return { payload: null };
    }
  }

  logout(request: Request, response?: Response): any {
    if (request) {
      request?.logOut((err: any) => err);
    }
    if (response) {
      response?.cookie('token', '', this.HTTP_ONLY_COOKIE);
      response?.cookie('token-expires', '', this.USERS_COOKIE);
    }
  }
}
