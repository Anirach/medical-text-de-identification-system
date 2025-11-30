"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeidService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const language_detection_1 = require("./language_detection");
const regex_patterns_1 = require("./regex_patterns");
const anonymize_1 = require("./anonymize");
let DeidService = class DeidService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async process(req) {
        const language = (0, language_detection_1.detectLanguage)(req.text);
        const regexEntities = (0, regex_patterns_1.detectEntitiesWithRegex)(req.text, req.enabledEntityTypes, req.customMaskList || []);
        const entities = regexEntities;
        const deidentifiedText = (0, anonymize_1.anonymizeText)(req.text, entities, req.method);
        const statistics = this.calculateStatistics(entities);
        return {
            deidentifiedText,
            entities,
            language,
            statistics,
        };
    }
    async processWithLLM(req) {
        const language = (0, language_detection_1.detectLanguage)(req.text);
        const regexEntities = (0, regex_patterns_1.detectEntitiesWithRegex)(req.text, req.enabledEntityTypes, req.customMaskList || []);
        let entities = regexEntities;
        try {
            const validation = await this.validateEntities({
                text: req.text,
                regexEntities,
                maskList: req.customMaskList || [],
            });
            entities = validation.entities;
        }
        catch (error) {
            console.error('LLM validation failed, falling back to regex-only:', error);
        }
        const deidentifiedText = (0, anonymize_1.anonymizeText)(req.text, entities, req.method);
        const statistics = this.calculateStatistics(entities);
        return {
            deidentifiedText,
            entities,
            language,
            statistics,
        };
    }
    async validateEntities(req) {
        const geminiApiKey = this.configService.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            console.warn('GEMINI_API_KEY not configured, returning regex entities');
            return { entities: req.regexEntities };
        }
        try {
            const prompt = this.buildValidationPrompt(req.text, req.regexEntities, req.maskList);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                    },
                }),
            });
            if (!response.ok) {
                console.error('Gemini API error:', await response.text());
                return { entities: req.regexEntities };
            }
            const data = (await response.json());
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.error('No text in Gemini response');
                return { entities: req.regexEntities };
            }
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('Could not extract JSON from Gemini response');
                return { entities: req.regexEntities };
            }
            const validatedEntities = JSON.parse(jsonMatch[0]);
            return { entities: validatedEntities };
        }
        catch (error) {
            console.error('Error validating entities:', error);
            return { entities: req.regexEntities };
        }
    }
    async listMaskKeywords(userId) {
        const keywords = await this.prisma.maskKeyword.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { createdAt: 'desc' },
        });
        return {
            keywords: keywords.map((k) => ({
                id: Number(k.id),
                keyword: k.keyword,
                entityType: k.entityType,
                userId: k.userId.toString(),
            })),
        };
    }
    async createMaskKeyword(userId, keyword, entityType) {
        const created = await this.prisma.maskKeyword.create({
            data: {
                userId: BigInt(userId),
                keyword,
                entityType,
            },
        });
        return {
            keyword: {
                id: Number(created.id),
                keyword: created.keyword,
                entityType: created.entityType,
                userId: created.userId.toString(),
            },
        };
    }
    async updateMaskKeyword(userId, id, keyword, entityType) {
        await this.prisma.maskKeyword.updateMany({
            where: {
                id: BigInt(id),
                userId: BigInt(userId),
            },
            data: {
                keyword,
                entityType,
            },
        });
    }
    async deleteMaskKeyword(userId, id) {
        await this.prisma.maskKeyword.deleteMany({
            where: {
                id: BigInt(id),
                userId: BigInt(userId),
            },
        });
    }
    calculateStatistics(entities) {
        const byType = {
            PERSON: 0,
            DATE: 0,
            LOCATION: 0,
            ID: 0,
            CONTACT: 0,
            ORGANIZATION: 0,
        };
        for (const entity of entities) {
            byType[entity.type] = (byType[entity.type] || 0) + 1;
        }
        return {
            totalEntities: entities.length,
            byType,
        };
    }
    buildValidationPrompt(text, regexEntities, maskList) {
        const customKeywords = maskList.map((m) => `"${m.keyword}" (${m.entityType})`).join(', ');
        return `You are a medical text de-identification expert specializing in Thai and English medical records.

Your task is to validate and enrich the detected entities in the following medical text.

**Text:**
${text}

**Regex-Detected Entities:**
${JSON.stringify(regexEntities, null, 2)}

**Custom Keywords to Detect:**
${customKeywords || 'None'}

**Instructions:**
1. Validate each regex-detected entity (keep, modify, or remove)
2. Find any MISSED entities, especially:
   - Full names with titles (Mr., Ms., Dr., นาย, นาง, etc.)
   - Names in context (born in, from, patient, doctor)
   - Dates in text format (December 1, 2023, March 3, 1990)
   - National IDs, passport numbers, policy numbers
   - Complete addresses with Thai components (ชั้น, อาคาร, ถนน, etc.)
   - Company names with Co., Ltd.
   - Insurance providers
   - Phone numbers with various separators (-, ‑, space)
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
- PERSON: Patient names, doctor names with titles (Dr., นพ., นาง, etc.)
- DATE: All formats including "December 1, 2023", "March 3, 1990", "10 มิถุนายน 2564"
- LOCATION: City names (Bangkok, Pattaya, California, Los Angeles), addresses, departments, rooms
- ID: National IDs (13+ digits), passport numbers, medical records, insurance policy numbers
- CONTACT: Phone numbers (with -, ‑, or space separators), emails
- ORGANIZATION: Hospitals, companies (Co., Ltd.), insurance companies, government departments

**Critical False Positive Rules - DO NOT tag:**
- Month names alone (January, February, etc.) as PERSON
- City/state names alone (Bangkok, Pattaya, California) as PERSON unless part of an address context
- Organization keywords (Hospital, Clinic, Insurance) as PERSON
- Dates like "December 1" or "March 3" as PERSON - these are DATE entities
- Generic location words without proper names

**Critical True Positive Rules - MUST tag:**
- Names with titles: "Dr. Arnon Sukprasert", "Ms. Olivia Martinez", "นพ. อธิวัฒน์ ชัยประเสริฐ"
- Birth dates in context: "born on March 3, 1990"
- Complete dates: "December 1, 2023", "December 15, 2023"
- National IDs with dashes: "987654321‑00"
- Passport numbers: "M12345678"
- Insurance policies: "WC‑99887766"
- Phone with special dashes: "091‑888‑7777" (note the special ‑ character)
- Companies: "InnovateX Co., Ltd."
- Long Thai addresses with multiple components

**Technical Rules:**
- "start" and "end" must be exact UTF-8 character positions in the original text
- Do NOT modify the original text
- Include ALL entities with confidence >= 0.5
- Return ONLY the JSON array, no other text`;
    }
};
exports.DeidService = DeidService;
exports.DeidService = DeidService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], DeidService);
//# sourceMappingURL=deid.service.js.map