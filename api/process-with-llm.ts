import { VercelRequest, VercelResponse } from '@vercel/node';

// This is a simplified version - for full LLM support, add Gemini API integration
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

  // For now, redirect to regular process endpoint
  // TODO: Implement Gemini API integration
  return res.status(501).json({ 
    message: 'LLM processing not available in serverless mode. Use regular processing instead.' 
  });
}

