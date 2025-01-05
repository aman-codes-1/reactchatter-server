import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private CLIENT_URL: string;

  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.CLIENT_URL = configService.get('CLIENT_URL');
  }

  @Get('google/login/:from')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {
    return {
      message: 'success',
    };
  }

  @Get('google/redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, sessionID } = request || {};
    const { accessToken } = await this.authService.login(
      { ...user, sessionID },
      response,
    );
    if (!accessToken) {
      throw new UnauthorizedException();
    }
    const encryptedAccessToken = await this.authService.encrypt(accessToken);
    const { from } = request?.params || {};
    const redirectUrl = `${this.CLIENT_URL}/?code=${encodeURIComponent(encryptedAccessToken)}&from=${encodeURIComponent(from || '/')}`;
    return response.redirect(redirectUrl);
  }

  @Get('google/cancel')
  @UseGuards(GoogleOAuthGuard)
  cancel(@Res() response: Response) {
    return response.redirect(this.CLIENT_URL);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: Request) {
    const user = request?.user;
    return {
      data: user,
      message: 'success',
    };
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async googleLogout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request, response);
    return {
      message: 'success',
    };
  }
}
