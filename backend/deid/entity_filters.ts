import { Entity } from "./types";

export function filterFalsePositives(entities: Entity[], text: string): Entity[] {
  return entities.filter(entity => {
    if (entity.type === "PERSON") {
      return !isLikelyNotAPerson(entity.text, text, entity.start);
    }
    if (entity.type === "DATE") {
      return isValidDate(entity.text);
    }
    if (entity.type === "LOCATION") {
      return !isLikelyNotALocation(entity.text);
    }
    if (entity.type === "ORGANIZATION") {
      return !isLikelyNotAnOrganization(entity.text);
    }
    return true;
  });
}

function isLikelyNotAPerson(text: string, fullText: string, position: number): boolean {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const locations = [
    "Bangkok", "Pattaya", "California", "Los Angeles", "New York", 
    "London", "Paris", "Tokyo", "Singapore"
  ];
  
  const organizations = [
    "Hospital", "Clinic", "Medical Center", "Insurance", "University",
    "Department", "Company", "Corporation", "Ministry"
  ];
  
  const words = text.split(/\s+/);
  
  for (const word of words) {
    if (months.includes(word)) return true;
    if (days.includes(word)) return true;
    if (locations.includes(word)) return true;
    if (organizations.includes(word)) return true;
  }
  
  const beforeContext = fullText.substring(Math.max(0, position - 50), position);
  const afterContext = fullText.substring(position + text.length, Math.min(fullText.length, position + text.length + 50));
  
  if (/\b(in|at|from|to)\s*$/i.test(beforeContext) && locations.some(loc => text.includes(loc))) {
    return true;
  }
  
  if (/^\s*\d+,?\s+\d{4}\b/.test(afterContext)) {
    return true;
  }
  
  return false;
}

function isValidDate(text: string): boolean {
  if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(text)) {
    return true;
  }
  
  if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i.test(text)) {
    return true;
  }
  
  if (/^\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+\d{4}$/.test(text)) {
    return true;
  }
  
  return true;
}

function isLikelyNotALocation(text: string): boolean {
  if (/^(the|a|an)\s+/i.test(text)) {
    return true;
  }
  
  return false;
}

function isLikelyNotAnOrganization(text: string): boolean {
  if (text.length < 3) {
    return true;
  }
  
  return false;
}

export function mergeOverlappingEntities(entities: Entity[]): Entity[] {
  if (entities.length === 0) return [];
  
  const sorted = [...entities].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  });
  
  const result: Entity[] = [];
  
  for (const entity of sorted) {
    const overlapping = result.filter(e => 
      (entity.start >= e.start && entity.start < e.end) ||
      (entity.end > e.start && entity.end <= e.end) ||
      (entity.start <= e.start && entity.end >= e.end)
    );
    
    if (overlapping.length === 0) {
      result.push(entity);
    } else {
      const longestOverlapping = overlapping.reduce((longest, current) => 
        (current.end - current.start) > (longest.end - longest.start) ? current : longest
      );
      
      if ((entity.end - entity.start) > (longestOverlapping.end - longestOverlapping.start)) {
        const index = result.indexOf(longestOverlapping);
        result.splice(index, 1);
        result.push(entity);
      }
    }
  }
  
  return result.sort((a, b) => a.start - b.start);
}

export function enhanceEntitiesWithContext(entities: Entity[], text: string): Entity[] {
  const enhanced: Entity[] = [];
  
  for (const entity of entities) {
    const beforeContext = text.substring(Math.max(0, entity.start - 100), entity.start);
    const afterContext = text.substring(entity.end, Math.min(text.length, entity.end + 100));
    
    if (entity.type === "PERSON") {
      if (/(Dr\.|Doctor|Mr\.|Mrs\.|Ms\.|นพ\.|พญ\.|นาย|นาง|นางสาว)\s*$/.test(beforeContext)) {
        const titleMatch = beforeContext.match(/(Dr\.|Doctor|Mr\.|Mrs\.|Ms\.|นพ\.|พญ\.|นาย|นาง|นางสาว)\s*$/);
        if (titleMatch) {
          const titleStart = entity.start - titleMatch[0].length;
          enhanced.push({
            ...entity,
            text: text.substring(titleStart, entity.end),
            start: titleStart,
          });
          continue;
        }
      }
    }
    
    if (entity.type === "DATE") {
      if (/born\s+on\s*$/i.test(beforeContext)) {
        const contextMatch = beforeContext.match(/born\s+on\s*$/i);
        if (contextMatch) {
          const contextStart = entity.start - contextMatch[0].length;
          enhanced.push({
            ...entity,
            text: text.substring(contextStart, entity.end),
            start: contextStart,
          });
          continue;
        }
      }
    }
    
    enhanced.push(entity);
  }
  
  return enhanced;
}
