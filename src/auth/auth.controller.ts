import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private CLIENT_URL: string;
  private ENCRYPTION_SECRET: string;

  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.CLIENT_URL = configService.get('CLIENT_URL');
    this.ENCRYPTION_SECRET = configService.get('ENCRYPTION_SECRET');
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
    const user = request?.user;
    const {
      google_auth: { tokens: { expires_in = 0, expiry_date = 0 } = {} } = {},
      ...rest
    } = user;
    const { accessToken } =
      (await this.authService.login(rest, response, expires_in, expiry_date)) ||
      {};
    const encryptedAccessToken = await this.authService.encrypt(
      accessToken,
      this.ENCRYPTION_SECRET,
    );
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
  googleLogout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.authService.logout(request, response);
    return {
      message: 'success',
    };
  }
}
