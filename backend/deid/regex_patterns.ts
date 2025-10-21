import { Entity, EntityType, MaskKeyword } from "./types";

export function detectEntitiesWithRegex(
  text: string,
  enabledTypes: EntityType[],
  customMaskList: MaskKeyword[]
): Entity[] {
  const entities: Entity[] = [];

  // Person names (English)
  if (enabledTypes.includes("PERSON")) {
    const englishNamePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    let match;
    while ((match = englishNamePattern.exec(text)) !== null) {
      entities.push({
        type: "PERSON",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Person names (Thai)
    const thaiNamePattern = /(?:ผู้ป่วย|หมอ|Dr\.\s+)?([ก-๙]+)\s+([ก-๙]+)(?:\s+([ก-๙]+))?/g;
    while ((match = thaiNamePattern.exec(text)) !== null) {
      entities.push({
        type: "PERSON",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Doctor names with titles
    const doctorPattern = /(Dr\.|Doctor|หมอ)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?/g;
    while ((match = doctorPattern.exec(text)) !== null) {
      entities.push({
        type: "PERSON",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Dates (Numeric)
  if (enabledTypes.includes("DATE")) {
    const numericDatePattern = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
    let match;
    while ((match = numericDatePattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Dates (Thai)
    const thaiDatePattern = /(?:วันที่\s+)?\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+\d{4}/g;
    while ((match = thaiDatePattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Phone numbers
  if (enabledTypes.includes("CONTACT")) {
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    let match;
    while ((match = phonePattern.exec(text)) !== null) {
      entities.push({
        type: "CONTACT",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    while ((match = emailPattern.exec(text)) !== null) {
      entities.push({
        type: "CONTACT",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Medical IDs
  if (enabledTypes.includes("ID")) {
    const idPattern = /\b(?:เลข|เลขที่|MRN[:：]?\s*|HN[:：]?\s*|ID[:：]?\s*)([A-Z]{2}\d{6,}|\d{5,})\b/g;
    let match;
    while ((match = idPattern.exec(text)) !== null) {
      entities.push({
        type: "ID",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Locations
  if (enabledTypes.includes("LOCATION")) {
    const locationPattern = /\b(?:ER|ICU|แผนก[ก-๙]+)\b/g;
    let match;
    while ((match = locationPattern.exec(text)) !== null) {
      entities.push({
        type: "LOCATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Organizations
  if (enabledTypes.includes("ORGANIZATION")) {
    const orgPattern = /\b(?:Hospital|Clinic|โรงพยาบาล[ก-๙]*|คลินิก[ก-๙]*)\b/gi;
    let match;
    while ((match = orgPattern.exec(text)) !== null) {
      entities.push({
        type: "ORGANIZATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Custom mask list keywords
  for (const maskItem of customMaskList) {
    if (!enabledTypes.includes(maskItem.entityType)) {
      continue;
    }

    const escapedKeyword = maskItem.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escapedKeyword, "gi");
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: maskItem.entityType,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Remove duplicates (prioritize longer matches)
  return removeDuplicateEntities(entities);
}

function removeDuplicateEntities(entities: Entity[]): Entity[] {
  const sorted = [...entities].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  });

  const result: Entity[] = [];
  for (const entity of sorted) {
    const overlaps = result.some(
      (e) => (entity.start >= e.start && entity.start < e.end) ||
             (entity.end > e.start && entity.end <= e.end) ||
             (entity.start <= e.start && entity.end >= e.end)
    );
    if (!overlaps) {
      result.push(entity);
    }
  }

  return result;
}
