import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.split('?')[0] || '';

  try {
    // POST /auth/signup
    if (req.method === 'POST' && path.endsWith('/signup')) {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashPassword(password),
        },
      });

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      res.setHeader('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
      return res.status(200).json({ user: { id: user.id.toString(), email: user.email } });
    }

    // POST /auth/login
    if (req.method === 'POST' && path.endsWith('/login')) {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      res.setHeader('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
      return res.status(200).json({ user: { id: user.id.toString(), email: user.email } });
    }

    // POST /auth/logout
    if (req.method === 'POST' && path.endsWith('/logout')) {
      const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
        const [key, val] = c.trim().split('=');
        acc[key] = val;
        return acc;
      }, {} as Record<string, string>) || {};

      const token = cookies.session;
      if (token) {
        await prisma.session.deleteMany({ where: { token } });
      }

      res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
      return res.status(200).json({});
    }

    // GET /auth/me
    if (req.method === 'GET' && path.endsWith('/me')) {
      const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
        const [key, val] = c.trim().split('=');
        acc[key] = val;
        return acc;
      }, {} as Record<string, string>) || {};

      const token = cookies.session;
      if (!token) {
        return res.status(200).json({});
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return res.status(200).json({});
      }

      return res.status(200).json({
        user: { id: session.user.id.toString(), email: session.user.email },
      });
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

