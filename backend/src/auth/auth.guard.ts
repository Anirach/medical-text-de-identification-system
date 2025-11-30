import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.session;

    if (!token) {
      throw new UnauthorizedException('missing session');
    }

    const authData = await this.authService.validateSession(token);
    request.user = authData;
    return true;
  }
}

