/* eslint-disable no-restricted-syntax */
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
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  private JWT_SECRET: string;

  private JWT_EXPIRATION_TIME: string;

  private HTTP_ONLY_COOKIE: CookieOptions;

  private USERS_COOKIE: CookieOptions;

  private CLIENT_URL: string;

  private GOOGLE_CLIENT_ID: string;

  private GOOGLE_CLIENT_SECRET: string;

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

    this.oauth2Client = new OAuth2Client({
      clientId: this.GOOGLE_CLIENT_ID,
      clientSecret: this.GOOGLE_CLIENT_SECRET,
      redirectUri: `${this.CLIENT_URL}/login`,
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
    const user = await this.UserModel.findById(userObjectId).lean();
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    return user;
  }

  async validateUser(userDetails: UserDocument): Promise<UserDocument> {
    const { email } = userDetails || {};
    const user = await this.UserModel.findOne({ email }).lean();
    if (!user) {
      const newUser = new this.UserModel({ ...userDetails });
      const savedUser = await newUser.save();
      return savedUser.toObject();
    }
    const { _id, createdAt, updatedAt, __v, ...restUser } = user;
    const {
      _id: _id2,
      createdAt: createdAt2,
      updatedAt: updatedAt2,
      __v: __v2,
      ...restUserDetails
    } = userDetails;
    const areEqual = this.compareObjects(restUser, restUserDetails);
    if (!areEqual) {
      const updatedUser = await this.UserModel.findByIdAndUpdate(
        { _id },
        { $set: userDetails },
        { upsert: true, new: true },
      ).lean();
      return updatedUser;
    }
    return user;
  }

  async login(
    payload: User,
    response: Response,
    expires_in: number,
    expiry_date: number,
  ): Promise<any> {
    const accessToken = await this.jwtService.signAsync(payload, {
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
    if (user) {
      if (user?.provider === 'google') {
        const accessToken = await this.googleRefreshToken(user, response);
        return accessToken;
      }
      throw new UnauthorizedException();
    }
    throw new UnauthorizedException();
  }

  async googleRefreshToken(user: UserDocument, response: Response) {
    const { google_auth: { tokens: { refresh_token = '' } = {} } = {} } = user;
    this.oauth2Client.setCredentials({
      refresh_token,
    });
    const { res: { data = {} } = {} } =
      await this.oauth2Client.getAccessToken();
    if (data) {
      this.oauth2Client.setCredentials(data);
      const auth = {
        ...user,
        google_auth: {
          ...user.google_auth,
          tokens: data,
        },
      } as UserDocument;
      const {
        google_auth: { tokens: { expires_in = 0, expiry_date = 0 } = {} } = {},
        ...rest
      } = await this.validateUser(auth);
      const { accessToken } =
        (await this.login(rest, response, expires_in, expiry_date)) || {};
      if (accessToken) {
        return accessToken;
      }
      throw new UnauthorizedException();
    }
    throw new UnauthorizedException();
  }

  verifyToken(token: string, secret: string): any {
    try {
      const payload = this.jwtService.verify(token, {
        secret,
      });
      if (payload) {
        return {
          payload,
        };
      }
      return {
        payload: null,
      };
    } catch (err) {
      return {
        payload: null,
      };
    }
  }

  logout(request: Request, response?: Response): any {
    if (response) {
      response?.cookie('token', '', this.HTTP_ONLY_COOKIE);
      response?.cookie('token-expires', '', this.USERS_COOKIE);
    }
    if (request) {
      request?.logOut((err: any) => err);
    }
  }
}
