import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserDocument } from '../user/user.schema';
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
    const user = request?.user;
    const {
      google_auth: { tokens: { expires_in = 0, expiry_date = 0 } = {} } = {},
      ...rest
    } = user as UserDocument;
    const { accessToken } =
      (await this.authService.login(rest, response, expires_in, expiry_date)) ||
      {};
    const { from } = request?.params || {};
    return response.redirect(
      `${this.CLIENT_URL}/login?token=${accessToken}&from=${from}`,
    );
  }

  @Get('google/cancel')
  @UseGuards(GoogleOAuthGuard)
  cancel(@Res() response: Response) {
    return response.redirect(`${this.CLIENT_URL}/login`);
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
