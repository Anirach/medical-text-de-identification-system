"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterFalsePositives = filterFalsePositives;
exports.mergeOverlappingEntities = mergeOverlappingEntities;
exports.enhanceEntitiesWithContext = enhanceEntitiesWithContext;
function filterFalsePositives(entities, text) {
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
function isLikelyNotAPerson(text, fullText, position) {
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
    const medicalTerms = [
        "Stroke", "Ischemic", "Hemorrhagic", "Recurrent", "Acute", "Chronic",
        "Syndrome", "Disease", "Disorder", "Condition", "Cardiac", "Pulmonary",
        "Neurological", "Diabetes", "Hypertension", "Cancer", "Tumor", "Infection",
        "Fever", "Pain", "Injury", "Fracture", "Surgery", "Procedure", "Therapy",
        "Treatment", "Medication", "Drug", "Dose", "Dosage", "Diagnosis", "Symptom",
        "Sign", "Test", "Examination", "Laboratory", "Radiology", "Pathology", "Biopsy",
        "Blood", "Urine", "Tissue", "Organ", "System", "Function", "Abnormal", "Normal",
        "Positive", "Negative", "Result", "Finding", "Report", "History", "Physical",
        "Assessment", "Plan", "Recommendation"
    ];
    const words = text.split(/\s+/);
    for (const word of words) {
        if (months.includes(word))
            return true;
        if (days.includes(word))
            return true;
        if (locations.includes(word))
            return true;
        if (organizations.includes(word))
            return true;
        if (medicalTerms.includes(word))
            return true;
    }
    const medicalPatterns = [
        /^(Recurrent|Acute|Chronic)\s+[A-Z][a-z]+/i,
        /[A-Z][a-z]+\s+(Stroke|Syndrome|Disease|Disorder|Condition)/i,
        /[A-Z][a-z]+\s+(Ischemic|Hemorrhagic|Cardiac|Pulmonary|Neurological)/i
    ];
    if (medicalPatterns.some(pattern => pattern.test(text))) {
        return true;
    }
    const beforeContext = fullText.substring(Math.max(0, position - 100), position).toLowerCase();
    const afterContext = fullText.substring(position + text.length, Math.min(fullText.length, position + text.length + 100)).toLowerCase();
    const medicalContextIndicators = [
        'diagnosis', 'diagnosed', 'diagnostic', 'history', 'present', 'presented', 'presenting',
        'with', 'suffering', 'complaining', 'complaint', 'symptom', 'sign', 'finding', 'finding',
        'condition', 'disease', 'disorder', 'syndrome', 'case', 'patient', 'admission', 'admitted',
        'treatment', 'therapy', 'medication', 'prescribed', 'prescription', 'dose', 'dosage',
        'examination', 'exam', 'test', 'laboratory', 'lab', 'result', 'report', 'assessment',
        'plan', 'recommendation', 'follow', 'follow-up', 'followup', 'visit', 'appointment'
    ];
    if (medicalContextIndicators.some(indicator => beforeContext.includes(indicator))) {
        return true;
    }
    if (medicalContextIndicators.some(indicator => afterContext.includes(indicator))) {
        return true;
    }
    if (/\b(in|at|from|to)\s*$/i.test(beforeContext) && locations.some(loc => text.includes(loc))) {
        return true;
    }
    if (/^\s*\d+,?\s+\d{4}\b/.test(afterContext)) {
        return true;
    }
    return false;
}
function isValidDate(text) {
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
function isLikelyNotALocation(text) {
    if (/^(the|a|an)\s+/i.test(text)) {
        return true;
    }
    return false;
}
function isLikelyNotAnOrganization(text) {
    if (text.length < 3) {
        return true;
    }
    return false;
}
function mergeOverlappingEntities(entities) {
    if (entities.length === 0)
        return [];
    const sorted = [...entities].sort((a, b) => {
        if (a.start !== b.start) {
            return a.start - b.start;
        }
        return (b.end - b.start) - (a.end - a.start);
    });
    const result = [];
    for (const entity of sorted) {
        const overlapping = result.filter(e => (entity.start >= e.start && entity.start < e.end) ||
            (entity.end > e.start && entity.end <= e.end) ||
            (entity.start <= e.start && entity.end >= e.end));
        if (overlapping.length === 0) {
            result.push(entity);
        }
        else {
            const longestOverlapping = overlapping.reduce((longest, current) => (current.end - current.start) > (longest.end - longest.start) ? current : longest);
            if ((entity.end - entity.start) > (longestOverlapping.end - longestOverlapping.start)) {
                const index = result.indexOf(longestOverlapping);
                result.splice(index, 1);
                result.push(entity);
            }
        }
    }
    return result.sort((a, b) => a.start - b.start);
}
function enhanceEntitiesWithContext(entities, text) {
    const enhanced = [];
    for (const entity of entities) {
        const beforeContext = text.substring(Math.max(0, entity.start - 100), entity.start);
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
//# sourceMappingURL=entity_filters.js.map