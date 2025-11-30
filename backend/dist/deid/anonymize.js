"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anonymizeText = anonymizeText;
function anonymizeText(text, entities, method) {
    const normalizedEntities = entities.map((e) => normalizeEntity(e, text));
    const sortedEntities = [...normalizedEntities].sort((a, b) => b.start - a.start);
    let result = text;
    const pseudonymCache = new Map();
    for (const entity of sortedEntities) {
        const textAtPosition = result.substring(entity.start, entity.end);
        if (textAtPosition !== entity.text) {
            console.warn(`Position mismatch for "${entity.text}". Expected at ${entity.start}-${entity.end}, found "${textAtPosition}"`);
            continue;
        }
        const replacement = generateReplacement(method, entity, pseudonymCache);
        result = result.substring(0, entity.start) + replacement + result.substring(entity.end);
    }
    return result;
}
function normalizeEntity(entity, text) {
    const actualText = text.substring(entity.start, entity.end);
    if (actualText === entity.text) {
        return entity;
    }
    const searchIndex = text.indexOf(entity.text);
    if (searchIndex !== -1) {
        console.warn(`Position mismatch for "${entity.text}". Correcting from ${entity.start} to ${searchIndex}`);
        return {
            ...entity,
            start: searchIndex,
            end: searchIndex + entity.text.length,
        };
    }
    console.error(`Could not find entity text "${entity.text}" in original text`);
    return entity;
}
function generateReplacement(method, entity, pseudonymCache) {
    switch (method) {
        case "redact":
            return "[REDACTED]";
        case "mask":
        case "generalize":
            return `[${entity.type}]`;
        case "pseudonymize":
            const cacheKey = `${entity.type}_${entity.text}`;
            if (pseudonymCache.has(cacheKey)) {
                return pseudonymCache.get(cacheKey);
            }
            const pseudonym = `[${entity.type}_${generateRandomId()}]`;
            pseudonymCache.set(cacheKey, pseudonym);
            return pseudonym;
        default:
            return `[${entity.type}]`;
    }
}
function generateRandomId() {
    return Math.random().toString(36).substring(2, 8);
}
//# sourceMappingURL=anonymize.js.map