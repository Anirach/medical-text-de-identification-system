import { api } from "encore.dev/api";
import { ProcessRequest, ProcessResponse, EntityType } from "./types";
import { detectLanguage } from "./language_detection";
import { detectEntitiesWithRegex } from "./regex_patterns";
import { anonymizeText } from "./anonymize";

// Processes medical text with LLM validation for enhanced accuracy
export const processWithLLM = api<ProcessRequest, ProcessResponse>(
  { expose: true, method: "POST", path: "/process-with-llm", auth: false },
  async (req) => {
    const language = detectLanguage(req.text);
    
    const regexEntities = detectEntitiesWithRegex(
      req.text,
      req.enabledEntityTypes,
      req.customMaskList || []
    );
    
    let entities = regexEntities;
    
    try {
      const { deid } = await import("~encore/clients");
      const validation = await deid.validateEntities({
        text: req.text,
        regexEntities,
        maskList: req.customMaskList || [],
      });
      entities = validation.entities;
    } catch (error) {
      console.error("LLM validation failed, falling back to regex-only:", error);
    }
    
    const deidentifiedText = anonymizeText(req.text, entities, req.method);
    
    const statistics = calculateStatistics(entities);
    
    return {
      deidentifiedText,
      entities,
      language,
      statistics,
    };
  }
);

function calculateStatistics(entities: any[]) {
  const byType: Record<EntityType, number> = {
    PERSON: 0,
    DATE: 0,
    LOCATION: 0,
    ID: 0,
    CONTACT: 0,
    ORGANIZATION: 0,
  };
  
  for (const entity of entities) {
    byType[entity.type as EntityType] = (byType[entity.type as EntityType] || 0) + 1;
  }
  
  return {
    totalEntities: entities.length,
    byType,
  };
}
