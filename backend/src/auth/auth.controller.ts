import { Controller, Post, Get, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

interface SignupRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() body: SignupRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(body.email, body.password);

    res.cookie('session', result.token, {
      expires: result.expiresAt,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return {
      user: result.user,
    };
  }

  @Post('login')
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);

    res.cookie('session', result.token, {
      expires: result.expiresAt,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return {
      user: result.user,
    };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.session;
    await this.authService.logout(token);

    res.cookie('session', '', {
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const token = req.cookies?.session;
    const authData = await this.authService.getCurrentUser(token);

    if (authData) {
      return {
        user: {
          id: authData.userID,
          email: authData.email,
        },
      };
    }

    return {};
  }
}

