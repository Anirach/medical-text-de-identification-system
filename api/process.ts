import { VercelRequest, VercelResponse } from '@vercel/node';
import { THAI_NAMES } from './thai-names';

// Medical terms that should NOT be detected as person names
const MEDICAL_TERMS = new Set([
  // English medical terms
  'stroke', 'diabetes', 'hypertension', 'cancer', 'tumor', 'infection',
  'pneumonia', 'fracture', 'surgery', 'therapy', 'treatment', 'diagnosis',
  'syndrome', 'disease', 'disorder', 'condition', 'symptom', 'fever',
  'pain', 'inflammation', 'acute', 'chronic', 'recurrent', 'ischemic',
  'hemorrhagic', 'coronary', 'cardiac', 'hepatic', 'renal', 'pulmonary',
  // Thai medical terms
  'โรค', 'อาการ', 'การรักษา', 'ยา', 'วินิจฉัย', 'ผ่าตัด', 'เลือด', 'ความดัน',
  'เบาหวาน', 'มะเร็ง', 'หัวใจ', 'ตับ', 'ไต', 'ปอด', 'สมอง', 'กระดูก',
]);

// Thai honorific titles (คำนำหน้าชื่อ) - ordered by priority
const THAI_TITLES = [
  // Combined academic + medical titles (longest first)
  'ศาสตราจารย์\\s*(?:นายแพทย์|แพทย์หญิง|ดร\\.?|ดอกเตอร์)',
  'รองศาสตราจารย์\\s*(?:นายแพทย์|แพทย์หญิง|ดร\\.?|ดอกเตอร์)',
  'ผู้ช่วยศาสตราจารย์\\s*(?:นายแพทย์|แพทย์หญิง|ดร\\.?|ดอกเตอร์)',
  'ศ\\.?\\s*นพ\\.?', 'ศ\\.?\\s*พญ\\.?', 'ศ\\.?\\s*ดร\\.?',
  'รศ\\.?\\s*นพ\\.?', 'รศ\\.?\\s*พญ\\.?', 'รศ\\.?\\s*ดร\\.?',
  'ผศ\\.?\\s*นพ\\.?', 'ผศ\\.?\\s*พญ\\.?', 'ผศ\\.?\\s*ดร\\.?',
  // Academic titles (standalone)
  'ศาสตราจารย์', 'รองศาสตราจารย์', 'ผู้ช่วยศาสตราจารย์',
  'ศ\\.', 'รศ\\.', 'ผศ\\.',
  // Medical titles
  'นายแพทย์', 'แพทย์หญิง', 'ทันตแพทย์', 'ทันตแพทย์หญิง',
  'เภสัชกร', 'เภสัชกรหญิง', 'สัตวแพทย์', 'สัตวแพทย์หญิง',
  'นพ\\.', 'พญ\\.', 'ทพ\\.', 'ทญ\\.', 'ภก\\.', 'ภญ\\.', 'สพ\\.', 
  // Doctor title (ดร. / Dr.)
  'ดอกเตอร์', 'ดร\\.', 'Dr\\.?',
  // Military titles
  'พลเอก', 'พลโท', 'พลตรี', 'พลเรือเอก', 'พลเรือโท', 'พลเรือตรี',
  'พันเอก', 'พันโท', 'พันตรี', 'ร้อยเอก', 'ร้อยโท', 'ร้อยตรี',
  'พล\\.?อ\\.?', 'พล\\.?ท\\.?', 'พล\\.?ต\\.?',
  'พ\\.?อ\\.?', 'พ\\.?ท\\.?', 'พ\\.?ต\\.?',
  'ร\\.?อ\\.?', 'ร\\.?ท\\.?', 'ร\\.?ต\\.?',
  'จ\\.?ส\\.?อ\\.?', 'จ\\.?ส\\.?ท\\.?', 'จ\\.?ส\\.?ต\\.?',
  // Common titles
  'นาย', 'นาง', 'นางสาว', 'น\\.?ส\\.?',
  'คุณหญิง', 'คุณ',
  'หม่อมราชวงศ์', 'หม่อมหลวง', 'หม่อมเจ้า',
  'ม\\.?ร\\.?ว\\.?', 'ม\\.?ล\\.?', 'ม\\.?จ\\.?',
];

// Organization/place prefixes that should NOT be part of person names
const STOP_WORDS = [
  'รพ', 'โรงพยาบาล', 'คลินิก', 'ศูนย์', 'สถาบัน', 'มหาวิทยาลัย', 'โรงเรียน',
  'บริษัท', 'ห้างหุ้นส่วน', 'สมาคม', 'มูลนิธิ', 'องค์กร', 'กรม', 'กระทรวง',
  'ถนน', 'ซอย', 'หมู่บ้าน', 'ตำบล', 'อำเภอ', 'จังหวัด', 'แขวง', 'เขต',
  'วันที่', 'เวลา', 'โทร', 'อีเมล', 'ที่อยู่',
];

// Build regex pattern for Thai names with titles
const THAI_TITLE_PATTERN = `(?:${THAI_TITLES.join('|')})`;

// Function to extract person name with title
function extractThaiPersonName(text: string, startIndex: number): { name: string; end: number } | null {
  const remaining = text.slice(startIndex);
  
  // Match title first
  const titleRegex = new RegExp(`^(${THAI_TITLE_PATTERN})\\s*`, 'i');
  const titleMatch = remaining.match(titleRegex);
  
  if (!titleMatch) return null;
  
  let name = titleMatch[0];
  let pos = titleMatch[0].length;
  let wordCount = 0;
  const maxWords = 2; // First name + Last name
  
  // Extract following Thai words (first name and last name)
  while (wordCount < maxWords && pos < remaining.length) {
    // Skip spaces
    const spaceMatch = remaining.slice(pos).match(/^\s+/);
    if (spaceMatch) {
      pos += spaceMatch[0].length;
    }
    
    // Check for stop words before extracting
    let isStopWord = false;
    for (const stopWord of STOP_WORDS) {
      if (remaining.slice(pos).startsWith(stopWord)) {
        isStopWord = true;
        break;
      }
    }
    if (isStopWord) break;
    
    // Extract Thai word
    const wordMatch = remaining.slice(pos).match(/^[ก-๙]+/);
    if (!wordMatch) break;
    
    // Check if this word is a stop word
    if (STOP_WORDS.includes(wordMatch[0])) break;
    
    name += (wordCount > 0 || spaceMatch ? ' ' : '') + wordMatch[0];
    pos += wordMatch[0].length;
    wordCount++;
  }
  
  // Must have at least one Thai word after title
  if (wordCount === 0) return null;
  
  return { name: name.trim(), end: startIndex + pos };
}

// Import regex patterns and anonymization logic
const ENTITY_PATTERNS = {
  PERSON: [
    // English names with titles
    /(?:Prof\.?|Assoc\.?\s*Prof\.?|Asst\.?\s*Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
  ],
  DATE: [
    // Date ranges: 16 Feb - 16 Aug 2021, 13 -27 Jan 2021
    /\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[-–]\s*\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}/gi,
    // Date range same month: 13 - 27 Jan 2021, 6-13 May 21
    /\d{1,2}\s*[-–]\s*\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}/gi,
    // Date with slashes/dashes: 17/12/2019, 17-12-2019, 17.12.2019
    /\d{1,2}\s*[\/\.]\s*\d{1,2}\s*[\/\.]\s*\d{2,4}/g,
    // DD Mon YYYY or DD Mon YY: 17 Dec 2019, 23 Nov 2025, 19 Oct 19
    /\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}/gi,
    // DD Mon (without year, but only 2+ chars month): 16 Feb, 19 Aug
    /\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?=\s*[-–,]|\s+\d{4}|\s*$|\s+[a-z])/gi,
    // Mon DD, YYYY: December 17, 2019
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/gi,
    // Thai date formats: 17 ธันวาคม 2562
    /\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*\d{2,4}/gi,
    // Thai date range
    /\d{1,2}\s+(?:ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*[-–]\s*\d{1,2}\s+(?:ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*\d{2,4}/gi,
  ],
  LOCATION: [
    /(?:ถนน|ซอย|หมู่บ้าน|ตำบล|อำเภอ|จังหวัด|แขวง|เขต)\s*[ก-๙a-zA-Z0-9]+/gi,
  ],
  ID: [
    // Thai National ID: 1-1234-12345-12-1
    /\b\d[\s\-]?\d{4}[\s\-]?\d{5}[\s\-]?\d{2}[\s\-]?\d\b/g,
    // Hospital number: HN: 12345 or HN 12345
    /\bHN\s*:?\s*\d+/gi,
    // Admission number: AN: 12345 or AN 12345
    /\bAN\s*:?\s*\d+/gi,
  ],
  CONTACT: [
    /0\d{1,2}[\s\-]?\d{3,4}[\s\-]?\d{4}/g, // Thai phone
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
  ],
  ORGANIZATION: [
    // Thai hospitals - use negative lookahead to stop before next org prefix
    /(?:โรงพยาบาล|รพ\.?)\s*[ก-๙]+(?:\s+(?!รพ|โรงพยาบาล|คลินิก|ศูนย์|สถาบัน|มหาวิทยาลัย)[ก-๙]+)?/gi,
    // Other Thai organizations
    /(?:คลินิก|ศูนย์การแพทย์|ศูนย์|สถาบัน|มหาวิทยาลัย)\s*[ก-๙]+(?:\s+(?!รพ|โรงพยาบาล|คลินิก|ศูนย์|สถาบัน|มหาวิทยาลัย)[ก-๙]+)?/gi,
    // Known hospital groups/companies
    /\b(?:BDMS|BNH|BCH|BUMRUNGRAD|BANGKOK\s+HOSPITAL|SAMITIVEJ|VIBHAVADI|PHYATHAI)\b/gi,
  ],
};

interface Entity {
  type: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

interface MaskKeyword {
  id?: number;
  keyword: string;
  entityType: string;
}

// Detect entities from custom mask keywords
function detectFromCustomMaskList(text: string, maskList: MaskKeyword[]): Entity[] {
  const entities: Entity[] = [];
  
  for (const item of maskList) {
    if (!item.keyword || !item.keyword.trim()) continue;
    
    // Escape special regex characters in the keyword
    const escapedKeyword = item.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type: item.entityType,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 1.0, // Highest confidence for user-defined keywords
      });
    }
  }
  
  return entities;
}

// Check if text contains medical terms (not person names)
function isMedicalTerm(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of MEDICAL_TERMS) {
    if (lower.includes(term)) return true;
  }
  return false;
}

// Check if Thai text contains a known Thai name
function containsThaiName(text: string): boolean {
  // Split by spaces and check each word
  const words = text.split(/\s+/);
  for (const word of words) {
    if (THAI_NAMES.has(word)) return true;
  }
  return false;
}

// Detect Thai names from corpus in text
function detectThaiNamesFromCorpus(text: string): Entity[] {
  const entities: Entity[] = [];
  
  // Look for sequences of Thai characters
  const thaiWordRegex = /[ก-๙]+/g;
  let match;
  
  while ((match = thaiWordRegex.exec(text)) !== null) {
    const word = match[0];
    if (THAI_NAMES.has(word) && !isMedicalTerm(word)) {
      entities.push({
        type: 'PERSON',
        text: word,
        start: match.index,
        end: match.index + word.length,
        confidence: 0.9,
      });
    }
  }
  
  return entities;
}

function detectEntities(text: string, enabledTypes: string[], customMaskList: MaskKeyword[] = []): Entity[] {
  const entities: Entity[] = [];
  
  // 0. Detect from custom mask list (highest priority)
  if (customMaskList.length > 0) {
    const customEntities = detectFromCustomMaskList(text, customMaskList);
    entities.push(...customEntities);
  }
  
  // 1. Detect Thai names with titles (highest priority)
  if (enabledTypes.includes('PERSON')) {
    const titleRegex = new RegExp(THAI_TITLE_PATTERN, 'gi');
    let match;
    while ((match = titleRegex.exec(text)) !== null) {
      const result = extractThaiPersonName(text, match.index);
      if (result) {
        entities.push({
          type: 'PERSON',
          text: result.name,
          start: match.index,
          end: result.end,
          confidence: 0.95,
        });
        // Move regex index to end of matched name
        titleRegex.lastIndex = result.end;
      }
    }
  }
  
  // 2. Detect Thai names from corpus (individual words not already captured)
  if (enabledTypes.includes('PERSON')) {
    const thaiNameEntities = detectThaiNamesFromCorpus(text);
    for (const nameEntity of thaiNameEntities) {
      // Check if this name is already covered by a title match
      const alreadyCovered = entities.some(e => 
        e.type === 'PERSON' && 
        nameEntity.start >= e.start && 
        nameEntity.end <= e.end
      );
      if (!alreadyCovered) {
        entities.push(nameEntity);
      }
    }
  }
  
  // 3. Use regex patterns for other entity types
  for (const type of enabledTypes) {
    const patterns = ENTITY_PATTERNS[type as keyof typeof ENTITY_PATTERNS] || [];
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Skip if it's a medical term for PERSON type
        if (type === 'PERSON' && isMedicalTerm(match[0])) {
          continue;
        }
        
        // Check if already covered
        const alreadyCovered = entities.some(e => 
          match!.index >= e.start && 
          match!.index + match![0].length <= e.end
        );
        if (alreadyCovered) continue;
        
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
  
  // Sort by position and remove overlapping entities (keep higher confidence)
  entities.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.confidence || 0) - (a.confidence || 0);
  });
  
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
    const { 
      text, 
      method = 'mask', 
      enabledEntityTypes = ['PERSON', 'DATE', 'LOCATION', 'ID', 'CONTACT', 'ORGANIZATION'],
      customMaskList = []
    } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const entities = detectEntities(text, enabledEntityTypes, customMaskList);
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

