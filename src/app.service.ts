import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private JWT_SECRET: string;

  private JWT_EXPIRATION_TIME: string;

  private CLIENT_URL: string;

  private GOOGLE_CLIENT_ID: string;

  private GOOGLE_CLIENT_SECRET: string;

  private NODE_ENV: string;

  constructor(private readonly configService: ConfigService) {
    this.JWT_SECRET = configService.get('JWT_SECRET');
    this.JWT_EXPIRATION_TIME = configService.get('JWT_EXPIRATION_TIME');
    this.CLIENT_URL = configService.get('CLIENT_URL');
    this.GOOGLE_CLIENT_ID = configService.get('GOOGLE_CLIENT_ID');
    this.GOOGLE_CLIENT_SECRET = configService.get('GOOGLE_CLIENT_SECRET');
    this.NODE_ENV = configService.get('NODE_ENV');
  }

  getHello(): string {
    return `Hello World! ${this.JWT_SECRET} ${this.JWT_EXPIRATION_TIME} ${this.NODE_ENV} ${this.CLIENT_URL}`;
  }
}
