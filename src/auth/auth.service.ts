import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CookieOptions, Request, Response } from 'express';
import { OnlineStatus, User, UserDocument } from '../user/user.schema';

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
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
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

  compareObjects(first: any, second: any) {
    if (first === second) return true;
    if (first === null || second === null) return false;
    if (typeof first !== 'object' || typeof second !== 'object') return false;
    const first_keys = Object.getOwnPropertyNames(first);
    const second_keys = Object.getOwnPropertyNames(second);
    if (first_keys.length !== second_keys.length) return false;
    for (const key of first_keys) {
      if (!Object.hasOwn(second, key)) return false;
      if (this.compareObjects(first[key], second[key]) === false) return false;
    }
    return true;
  }

  async findOneById(userId: string): Promise<UserDocument> {
    const userObjectId = new ObjectId(userId);
    const user = (await this.UserModel.findById(
      userObjectId,
    ).lean()) as UserDocument;
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    return user;
  }

  async validateUser(userDetails: UserDocument): Promise<UserDocument> {
    const { email } = userDetails;
    const user = (await this.UserModel.findOne({
      email,
    }).lean()) as UserDocument;
    if (!user) {
      const newUser = new this.UserModel(userDetails);
      const savedUser = (await newUser.save()).toObject();
      return savedUser;
    }
    const { _id, createdAt, updatedAt, ...restUser } = user;
    const {
      _id: _id2,
      createdAt: createdAt2,
      updatedAt: updatedAt2,
      ...restUserDetails
    } = userDetails;
    const areEqual = this.compareObjects(restUser, restUserDetails);
    if (!areEqual) {
      const updatedUser = (await this.UserModel.findByIdAndUpdate(
        { _id },
        { $set: userDetails },
        { upsert: true, new: true },
      ).lean()) as UserDocument;
      return updatedUser;
    }
    return user;
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

  async login(user: UserDocument, response: Response): Promise<any> {
    const { authTokens: { expires_in = 0, expiry_date = 0 } = {}, ...rest } =
      user || {};
    const accessToken = await this.jwtService.signAsync(rest, {
      secret: this.JWT_SECRET,
      expiresIn: `${expires_in || this.JWT_EXPIRATION_TIME}s`,
    });
    if (accessToken) {
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

  async refreshToken(payload: UserDocument, response: Response) {
    const user = await this.findOneById(String(payload?._id));
    if (user && user?.provider === 'google') {
      const res = await this.googleRefreshToken(user, response);
      return res;
    }
    throw new UnauthorizedException();
  }

  async googleRefreshToken(user: UserDocument, response: Response) {
    let newAccessToken: string;
    let reAuthenticatedUser: UserDocument;

    try {
      const { authTokens: { refresh_token = '' } = {} } = user || {};
      this.oauth2Client.setCredentials({
        refresh_token,
      });
      const { res: { data = {} } = {} } =
        await this.oauth2Client.getAccessToken();

      if (!data?.access_token) {
        throw new UnauthorizedException('Refresh token is revoked or expired.');
      }

      newAccessToken = data?.access_token;
      this.oauth2Client.setCredentials(data);

      reAuthenticatedUser = {
        ...user,
        authTokens: data,
      } as UserDocument;

      const validatedUser = await this.validateUser(reAuthenticatedUser);
      if (validatedUser) {
        reAuthenticatedUser = validatedUser;
        const { accessToken } = await this.login(reAuthenticatedUser, response);
        if (accessToken) {
          newAccessToken = accessToken;
        }
      }
    } catch (err) {
      throw new UnauthorizedException('Refresh token is revoked or expired.');
    }

    return {
      newAccessToken,
      reAuthenticatedUser,
    };
  }

  async verifyToken(token: string, secret: string) {
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

  async updateOnlineStatus(userId: string, onlineStatus: OnlineStatus) {
    const userObjectId = new ObjectId(userId);
    const updatedUser = (await this.UserModel.findByIdAndUpdate(
      { _id: userObjectId },
      { $set: { onlineStatus } },
      { upsert: true, new: true },
    ).lean()) as UserDocument;
    return updatedUser;
  }
}
