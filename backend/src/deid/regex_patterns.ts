import { Entity, EntityType, MaskKeyword } from "./types";
import { filterFalsePositives, mergeOverlappingEntities, enhanceEntitiesWithContext } from "./entity_filters";

export function detectEntitiesWithRegex(
  text: string,
  enabledTypes: EntityType[],
  customMaskList: MaskKeyword[]
): Entity[] {
  const entities: Entity[] = [];

  // Person names (English)
  if (enabledTypes.includes("PERSON")) {
    const titlePattern = /(Mr\.|Mrs\.|Ms\.|Miss|Dr\.|Doctor|Prof\.|Professor|นาย|นาง|นางสาว|นพ\.|พญ\.|ผศ\.)\s+([A-ZÀ-ÿก-๙][a-zà-ÿก-๙]+(?:\s+[A-ZÀ-ÿก-๙][a-zà-ÿก-๙]+)*)/g;
    let match;
    while ((match = titlePattern.exec(text)) !== null) {
      entities.push({
        type: "PERSON",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const englishNamePattern = /\b(?!(?:January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Hospital|Clinic|Center|Medical|Health|Insurance|University|Company|Corporation|Department|Street|Avenue|Road|Boulevard|City|State|Province|District|County|Bangkok|Pattaya|California|Angeles|York|Stroke|Ischemic|Hemorrhagic|Recurrent|Syndrome|Disease|Disorder|Condition|Acute|Chronic|Cardiac|Pulmonary|Neurological|Diabetes|Hypertension|Cancer|Tumor|Infection|Fever|Pain|Injury|Fracture|Surgery|Procedure|Therapy|Treatment|Medication|Drug|Dose|Dosage|Diagnosis|Symptom|Sign|Test|Examination|Laboratory|Radiology|Pathology|Biopsy|Blood|Urine|Tissue|Organ|System|Function|Disorder|Abnormal|Normal|Positive|Negative|Result|Finding|Report|History|Physical|Assessment|Plan|Recommendation)\b)[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    while ((match = englishNamePattern.exec(text)) !== null) {
      const name = match[0];
      if (!isCommonOrganizationOrLocation(name)) {
        entities.push({
          type: "PERSON",
          text: name,
          start: match.index,
          end: match.index + name.length,
        });
      }
    }

    const thaiNamePattern = /(?:คุณ|นาย|นาง|นางสาว|ผู้ป่วย)\s+([ก-๙]+\s+[ก-๙]+)/g;
    while ((match = thaiNamePattern.exec(text)) !== null) {
      entities.push({
        type: "PERSON",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

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

    const monthNameDatePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
    while ((match = monthNameDatePattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const birthDatePattern = /\b(?:born\s+on\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
    while ((match = birthDatePattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const thaiDatePattern = /(?:วันที่\s+)?\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+\d{4}/g;
    while ((match = thaiDatePattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const yearOnlyPattern = /\b(?:in|since|from|year)\s+(19|20)\d{2}\b/gi;
    while ((match = yearOnlyPattern.exec(text)) !== null) {
      entities.push({
        type: "DATE",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  if (enabledTypes.includes("CONTACT")) {
    const phonePattern = /\b\d{3}[-.‑\s]?\d{3}[-.‑\s]?\d{4}\b/g;
    let match;
    while ((match = phonePattern.exec(text)) !== null) {
      entities.push({
        type: "CONTACT",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const thaiPhonePattern = /\b0[-.‑\s]?\d{4}[-.‑\s]?\d{4}\b/g;
    while ((match = thaiPhonePattern.exec(text)) !== null) {
      entities.push({
        type: "CONTACT",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

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

  if (enabledTypes.includes("ID")) {
    const idPattern = /\b(?:เลข|เลขที่|MRN[:：]?\s*|HN[:：]?\s*|ID[:：]?\s*|National\s+ID[:：]?\s*)([A-Z]{2}\d{6,}|\d{5,})\b/gi;
    let match;
    while ((match = idPattern.exec(text)) !== null) {
      entities.push({
        type: "ID",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const nationalIdPattern = /\b\d{13}(?:[-.‑]\d{2})?\b/g;
    while ((match = nationalIdPattern.exec(text)) !== null) {
      entities.push({
        type: "ID",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const passportPattern = /\b(?:passport|หนังสือเดินทาง)[\s:]*([A-Z]\d{7,8})\b/gi;
    while ((match = passportPattern.exec(text)) !== null) {
      entities.push({
        type: "ID",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const policyPattern = /\b(?:policy\s+no\.?|insurance\s+no\.?|policy)[\s:]*([A-Z]{2}[-.‑]?\d{8})\b/gi;
    while ((match = policyPattern.exec(text)) !== null) {
      entities.push({
        type: "ID",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  if (enabledTypes.includes("LOCATION")) {
    const departmentPattern = /\b(?:ER|ICU|แผนก[ก-๙]+|Room\s+\d+|Records\s+Department)\b/gi;
    let match;
    while ((match = departmentPattern.exec(text)) !== null) {
      entities.push({
        type: "LOCATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const addressPattern = /\b(?:ชั้น|อาคาร|ถนน|ซอย|แขวง|เขต)\s+[ก-๙A-Za-z0-9\s]+(?:(?:ชั้น|อาคาร|ถนน|ซอย|แขวง|เขต)\s+[ก-๙A-Za-z0-9\s]+)*/g;
    while ((match = addressPattern.exec(text)) !== null) {
      if (match[0].length < 200) {
        entities.push({
          type: "LOCATION",
          text: match[0].trim(),
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    const cityStatePattern = /\b(?:Bangkok|Pattaya|California|Los Angeles|New York|กรุงเทพมหานคร|เชียงใหม่|ภูเก็ต)\b/g;
    while ((match = cityStatePattern.exec(text)) !== null) {
      entities.push({
        type: "LOCATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  if (enabledTypes.includes("ORGANIZATION")) {
    const hospitalPattern = /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Hospital|Medical\s+Center|Clinic)|โรงพยาบาล[ก-๙]+(?:\s+[ก-๙]+)*|คลินิก[ก-๙]+)\b/g;
    let match;
    while ((match = hospitalPattern.exec(text)) !== null) {
      entities.push({
        type: "ORGANIZATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const companyPattern = /\b[A-Z][a-zA-Z]*(?:X)?\s+Co\.?,?\s+Ltd\.?\b/g;
    while ((match = companyPattern.exec(text)) !== null) {
      entities.push({
        type: "ORGANIZATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const insurancePattern = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+Insurance\b/g;
    while ((match = insurancePattern.exec(text)) !== null) {
      entities.push({
        type: "ORGANIZATION",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    const govPattern = /\b(?:United\s+States\s+)?Department\s+of\s+[A-Z][a-z]+\b/g;
    while ((match = govPattern.exec(text)) !== null) {
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

  let filteredEntities = removeDuplicateEntities(entities);
  
  filteredEntities = filterFalsePositives(filteredEntities, text);
  
  filteredEntities = mergeOverlappingEntities(filteredEntities);
  
  filteredEntities = enhanceEntitiesWithContext(filteredEntities, text);
  
  return filteredEntities;
}

function isCommonOrganizationOrLocation(name: string): boolean {
  const commonWords = [
    "January", "February", "March", "April", "May", "June", "July", "August", 
    "September", "October", "November", "December",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "Hospital", "Clinic", "Center", "Medical", "Health", "Insurance", "University",
    "Company", "Corporation", "Department", "Street", "Avenue", "Road", "Boulevard",
    "Bangkok", "Pattaya", "California", "Angeles", "York", "London", "Paris"
  ];
  
  const medicalTerms = [
    "Stroke", "Ischemic", "Hemorrhagic", "Recurrent", "Acute", "Chronic",
    "Syndrome", "Disease", "Disorder", "Condition", "Cardiac", "Pulmonary",
    "Neurological", "Diabetes", "Hypertension", "Cancer", "Tumor", "Infection",
    "Fever", "Pain", "Injury", "Fracture", "Surgery", "Procedure", "Therapy",
    "Treatment", "Medication", "Drug", "Dose", "Dosage", "Diagnosis", "Symptom",
    "Sign", "Test", "Examination", "Laboratory", "Radiology", "Pathology", "Biopsy",
    "Blood", "Urine", "Tissue", "Organ", "System", "Function", "Abnormal", "Normal",
    "Positive", "Negative", "Result", "Finding", "Report", "History", "Physical",
    "Assessment", "Plan", "Recommendation", "Patient", "Doctor", "Nurse", "Physician"
  ];
  
  const words = name.split(/\s+/);
  return words.some(word => commonWords.includes(word) || medicalTerms.includes(word));
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

