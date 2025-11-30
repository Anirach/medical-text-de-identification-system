import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface AuthData {
  userID: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async signup(email: string, password: string) {
    const passwordHash = this.hashPassword(password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('user with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id.toString(),
        email: user.email,
      },
    };
  }

  async login(email: string, password: string) {
    const passwordHash = this.hashPassword(password);

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        passwordHash,
      },
    });

    if (!user) {
      throw new UnauthorizedException('invalid email or password');
    }

    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt,
      user: {
        id: user.id.toString(),
        email: user.email,
      },
    };
  }

  async logout(token: string) {
    if (token) {
      await this.prisma.session.deleteMany({
        where: { token },
      });
    }
  }

  async getCurrentUser(token: string | undefined): Promise<AuthData | null> {
    if (!token) {
      return null;
    }

    const session = await this.prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    return {
      userID: session.user.id.toString(),
      email: session.user.email,
    };
  }

  async validateSession(token: string): Promise<AuthData> {
    const authData = await this.getCurrentUser(token);
    if (!authData) {
      throw new UnauthorizedException('invalid or expired session');
    }
    return authData;
  }
}

