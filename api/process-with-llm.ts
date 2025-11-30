import { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface Entity {
  type: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

// Thai honorific titles (คำนำหน้าชื่อ)
const THAI_TITLES = [
  'ศ\\.?\\s*นพ\\.?', 'ศ\\.?\\s*พญ\\.?', 'ศ\\.?\\s*ดร\\.?', 'ศ\\.?',
  'รศ\\.?\\s*นพ\\.?', 'รศ\\.?\\s*พญ\\.?', 'รศ\\.?\\s*ดร\\.?', 'รศ\\.?',
  'ผศ\\.?\\s*นพ\\.?', 'ผศ\\.?\\s*พญ\\.?', 'ผศ\\.?\\s*ดร\\.?', 'ผศ\\.?',
  'นพ\\.?', 'พญ\\.?', 'ทพ\\.?', 'ทญ\\.?', 'ภก\\.?', 'ภญ\\.?',
  'พล\\.?อ\\.?', 'พล\\.?ท\\.?', 'พล\\.?ต\\.?',
  'พ\\.?อ\\.?', 'พ\\.?ท\\.?', 'พ\\.?ต\\.?',
  'ร\\.?อ\\.?', 'ร\\.?ท\\.?', 'ร\\.?ต\\.?',
  'นาย', 'นาง', 'นางสาว', 'น\\.?ส\\.?', 'คุณ',
  'ม\\.?ร\\.?ว\\.?', 'ม\\.?ล\\.?', 'ม\\.?จ\\.?',
];

const THAI_TITLE_PATTERN = `(?:${THAI_TITLES.join('|')})`;
const THAI_NAME_WITH_TITLE = new RegExp(
  `${THAI_TITLE_PATTERN}\\s*[ก-๙]+(?:\\s+[ก-๙]+)*`,
  'gi'
);

// Basic regex patterns for initial detection
const ENTITY_PATTERNS = {
  PERSON: [
    THAI_NAME_WITH_TITLE,
    /(?:Prof\.?|Assoc\.?\s*Prof\.?|Asst\.?\s*Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
  ],
  DATE: [
    /\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4}/g,
    /\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*\d{2,4}/gi,
  ],
  LOCATION: [
    /(?:ถนน|ซอย|หมู่บ้าน|ตำบล|อำเภอ|จังหวัด|แขวง|เขต)\s*[ก-๙a-zA-Z0-9]+/gi,
  ],
  ID: [
    /\d[\s\-]?\d{4}[\s\-]?\d{5}[\s\-]?\d{2}[\s\-]?\d/g,
    /HN\s*:?\s*\d+/gi,
    /AN\s*:?\s*\d+/gi,
  ],
  CONTACT: [
    /0\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ],
  ORGANIZATION: [
    /(?:โรงพยาบาล|รพ\.?|คลินิก|ศูนย์|สถาบัน)\s*[ก-๙a-zA-Z]+/gi,
  ],
};

function detectEntitiesWithRegex(text: string, enabledTypes: string[]): Entity[] {
  const entities: Entity[] = [];
  
  for (const type of enabledTypes) {
    const patterns = ENTITY_PATTERNS[type as keyof typeof ENTITY_PATTERNS] || [];
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.7,
        });
      }
    }
  }
  
  return entities;
}

async function validateEntitiesWithLLM(text: string, entities: Entity[]): Promise<Entity[]> {
  if (!GEMINI_API_KEY || entities.length === 0) {
    return entities;
  }

  const prompt = `You are a medical text de-identification expert. Analyze the following entities detected in a medical text and determine if they are truly sensitive information that should be de-identified.

Text: "${text}"

Detected entities:
${entities.map((e, i) => `${i + 1}. "${e.text}" (type: ${e.type})`).join('\n')}

For each entity, respond with a JSON array where each object has:
- "index": the entity number (1-based)
- "isValid": true if it should be de-identified, false if it's a false positive
- "confidence": a number between 0 and 1

Consider:
- Medical terms like "Stroke", "Diabetes", "Hypertension" are NOT person names
- Drug names are NOT person names
- Anatomical terms are NOT locations
- Medical abbreviations are NOT IDs

Respond ONLY with the JSON array, no other text.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return entities;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return entities;
    }

    const validations = JSON.parse(jsonMatch[0]);
    
    // Filter entities based on LLM validation
    return entities.filter((entity, index) => {
      const validation = validations.find((v: any) => v.index === index + 1);
      if (validation) {
        entity.confidence = validation.confidence || entity.confidence;
        return validation.isValid !== false;
      }
      return true;
    });
  } catch (error) {
    console.error('LLM validation error:', error);
    return entities;
  }
}

function anonymize(text: string, entities: Entity[], method: string): string {
  let result = text;
  const sorted = [...entities].sort((a, b) => b.start - a.start);
  
  for (const entity of sorted) {
    let replacement: string;
    switch (method) {
      case 'redact':
        replacement = '[REDACTED]';
        break;
      case 'mask':
        replacement = `[${entity.type}]`;
        break;
      case 'generalize':
        replacement = `<${entity.type}>`;
        break;
      case 'pseudonymize':
        replacement = `${entity.type}_${Math.random().toString(36).substr(2, 6)}`;
        break;
      default:
        replacement = `[${entity.type}]`;
    }
    result = result.slice(0, entity.start) + replacement + result.slice(entity.end);
  }
  
  return result;
}

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

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { text, method = 'mask', enabledEntityTypes = ['PERSON', 'DATE', 'LOCATION', 'ID', 'CONTACT', 'ORGANIZATION'] } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Step 1: Detect entities with regex
    let entities = detectEntitiesWithRegex(text, enabledEntityTypes);
    
    // Step 2: Remove overlapping entities
    entities.sort((a, b) => a.start - b.start);
    const filtered: Entity[] = [];
    for (const entity of entities) {
      const last = filtered[filtered.length - 1];
      if (!last || entity.start >= last.end) {
        filtered.push(entity);
      }
    }
    
    // Step 3: Validate with LLM
    const validatedEntities = await validateEntitiesWithLLM(text, filtered);
    
    // Step 4: Anonymize
    const deidentifiedText = anonymize(text, validatedEntities, method);

    const statistics = {
      totalEntities: validatedEntities.length,
      byType: validatedEntities.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return res.status(200).json({
      deidentifiedText,
      entities: validatedEntities,
      language: /[ก-๙]/.test(text) ? 'th' : 'en',
      statistics,
    });
  } catch (error: any) {
    console.error('Process with LLM error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

