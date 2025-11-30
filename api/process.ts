import { VercelRequest, VercelResponse } from '@vercel/node';

// Import regex patterns and anonymization logic
const ENTITY_PATTERNS = {
  PERSON: [
    // Thai names
    /(?:นาย|นาง|นางสาว|ด\.?ร\.?|ผศ\.?|รศ\.?|ศ\.?|พล\.?[อตตร]\.?|พ\.?[อตตร]\.?|ร\.?[อตตร]\.?|จ\.?[อส]\.?)\s*[ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)*/gi,
    // English names with titles
    /(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Prof\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
  ],
  DATE: [
    // Thai date formats
    /\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4}/g,
    /\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*\d{2,4}/gi,
    // English date formats
    /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi,
  ],
  LOCATION: [
    /(?:ถนน|ซอย|หมู่บ้าน|ตำบล|อำเภอ|จังหวัด|แขวง|เขต)\s*[ก-๙a-zA-Z0-9]+/gi,
  ],
  ID: [
    /\d[\s\-]?\d{4}[\s\-]?\d{5}[\s\-]?\d{2}[\s\-]?\d/g, // Thai ID
    /HN\s*:?\s*\d+/gi, // Hospital number
    /AN\s*:?\s*\d+/gi, // Admission number
  ],
  CONTACT: [
    /0\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g, // Thai phone
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
  ],
  ORGANIZATION: [
    /(?:โรงพยาบาล|รพ\.?|คลินิก|ศูนย์|สถาบัน)\s*[ก-๙a-zA-Z]+/gi,
  ],
};

interface Entity {
  type: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

function detectEntities(text: string, enabledTypes: string[]): Entity[] {
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
          confidence: 0.8,
        });
      }
    }
  }
  
  // Remove overlapping entities
  entities.sort((a, b) => a.start - b.start);
  const filtered: Entity[] = [];
  for (const entity of entities) {
    const last = filtered[filtered.length - 1];
    if (!last || entity.start >= last.end) {
      filtered.push(entity);
    }
  }
  
  return filtered;
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

  try {
    const { text, method = 'mask', enabledEntityTypes = ['PERSON', 'DATE', 'LOCATION', 'ID', 'CONTACT', 'ORGANIZATION'] } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const entities = detectEntities(text, enabledEntityTypes);
    const deidentifiedText = anonymize(text, entities, method);

    const statistics = {
      totalEntities: entities.length,
      byType: entities.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return res.status(200).json({
      deidentifiedText,
      entities,
      language: /[ก-๙]/.test(text) ? 'th' : 'en',
      statistics,
    });
  } catch (error: any) {
    console.error('Process error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

