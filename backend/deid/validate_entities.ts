import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { ValidateEntitiesRequest, ValidateEntitiesResponse, Entity } from "./types";

const geminiApiKey = secret("GeminiAPIKey");

// Validates and enriches entities using Google Gemini 2.0 Flash
export const validateEntities = api<ValidateEntitiesRequest, ValidateEntitiesResponse>(
  { expose: true, method: "POST", path: "/validate-entities", auth: true },
  async (req) => {
    try {
      const prompt = buildValidationPrompt(req.text, req.regexEntities, req.maskList);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt,
              }],
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini API error:", await response.text());
        return { entities: req.regexEntities };
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.error("No text in Gemini response");
        return { entities: req.regexEntities };
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Could not extract JSON from Gemini response");
        return { entities: req.regexEntities };
      }

      const validatedEntities = JSON.parse(jsonMatch[0]) as Entity[];
      return { entities: validatedEntities };
    } catch (error) {
      console.error("Error validating entities:", error);
      return { entities: req.regexEntities };
    }
  }
);

function buildValidationPrompt(
  text: string,
  regexEntities: Entity[],
  maskList: any[]
): string {
  const customKeywords = maskList.map((m) => `"${m.keyword}" (${m.entityType})`).join(", ");
  
  return `You are a medical text de-identification expert specializing in Thai and English medical records.

Your task is to validate and enrich the detected entities in the following medical text.

**Text:**
${text}

**Regex-Detected Entities:**
${JSON.stringify(regexEntities, null, 2)}

**Custom Keywords to Detect:**
${customKeywords || "None"}

**Instructions:**
1. Validate each regex-detected entity (keep, modify, or remove)
2. Find any MISSED entities, especially:
   - Partial or abbreviated Thai names (e.g., "สมช" from "สมชาย")
   - Thai patient/doctor references without full names
   - Contextual identifiers
3. Assign confidence scores (0.0-1.0) to all entities
4. Consider the custom keywords as additional entities to detect
5. Return ONLY a JSON array of entities in this exact format:

[
  {
    "type": "PERSON",
    "text": "exact text from original",
    "start": number,
    "end": number,
    "confidence": 0.95
  }
]

**Entity Types:**
- PERSON: Patient names, doctor names, Thai/English names
- DATE: All date formats (numeric, Thai text)
- LOCATION: Addresses, hospitals, departments
- ID: Medical record numbers, national IDs
- CONTACT: Phone numbers, emails
- ORGANIZATION: Hospital names, clinic names

**Critical Rules:**
- "start" and "end" must be exact character positions in the original text
- Do NOT modify the original text
- Include ALL entities with confidence >= 0.5
- Partial Thai names are important - look for abbreviated patient names
- DO NOT tag medication/drug names (e.g., paracetamol, aspirin, antibiotics) as PERSON
- DO NOT tag medical procedures or tests (e.g., MRI, CT, Lab) as PERSON
- Return ONLY the JSON array, no other text`;
}
