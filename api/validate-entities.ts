import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { regexEntities = [] } = req.body;
    
    // Return entities as-is (validation would require LLM)
    return res.status(200).json({ entities: regexEntities });
  } catch (error: any) {
    console.error('Validate entities error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

