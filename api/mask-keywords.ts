import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserFromSession(req: VercelRequest): Promise<{ id: bigint; email: string } | null> {
  const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    acc[key] = val;
    return acc;
  }, {} as Record<string, string>) || {};

  const token = cookies.session;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = await getUserFromSession(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const url = req.url || '';
    const idMatch = url.match(/\/mask-keywords\/(\d+)/);
    const id = idMatch ? parseInt(idMatch[1]) : null;

    // GET /mask-keywords
    if (req.method === 'GET' && !id) {
      const keywords = await prisma.maskKeyword.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        keywords: keywords.map(k => ({
          id: Number(k.id),
          keyword: k.keyword,
          entityType: k.entityType,
          userId: k.userId.toString(),
        })),
      });
    }

    // POST /mask-keywords
    if (req.method === 'POST') {
      const { keyword, entityType } = req.body;

      if (!keyword || !entityType) {
        return res.status(400).json({ message: 'Keyword and entityType required' });
      }

      const created = await prisma.maskKeyword.create({
        data: {
          userId: user.id,
          keyword,
          entityType,
        },
      });

      return res.status(200).json({
        keyword: {
          id: Number(created.id),
          keyword: created.keyword,
          entityType: created.entityType,
          userId: created.userId.toString(),
        },
      });
    }

    // PUT /mask-keywords/:id
    if (req.method === 'PUT' && id) {
      const { keyword, entityType } = req.body;

      const existing = await prisma.maskKeyword.findFirst({
        where: { id: BigInt(id), userId: user.id },
      });

      if (!existing) {
        return res.status(404).json({ message: 'Not found' });
      }

      await prisma.maskKeyword.update({
        where: { id: BigInt(id) },
        data: { keyword, entityType },
      });

      return res.status(200).json({});
    }

    // DELETE /mask-keywords/:id
    if (req.method === 'DELETE' && id) {
      const existing = await prisma.maskKeyword.findFirst({
        where: { id: BigInt(id), userId: user.id },
      });

      if (!existing) {
        return res.status(404).json({ message: 'Not found' });
      }

      await prisma.maskKeyword.delete({
        where: { id: BigInt(id) },
      });

      return res.status(200).json({});
    }

    return res.status(404).json({ message: 'Not found' });
  } catch (error: any) {
    console.error('Mask keywords error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

