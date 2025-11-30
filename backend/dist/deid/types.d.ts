export type EntityType = "PERSON" | "DATE" | "LOCATION" | "ID" | "CONTACT" | "ORGANIZATION";
export type AnonymizationMethod = "redact" | "mask" | "generalize" | "pseudonymize";
export interface Entity {
    type: EntityType;
    text: string;
    start: number;
    end: number;
    confidence?: number;
}
export interface MaskKeyword {
    id?: number;
    keyword: string;
    entityType: EntityType;
    userId?: string;
}
export interface ProcessRequest {
    text: string;
    method: AnonymizationMethod;
    enabledEntityTypes: EntityType[];
    customMaskList?: MaskKeyword[];
}
export interface ProcessResponse {
    deidentifiedText: string;
    entities: Entity[];
    language: string;
    statistics: {
        totalEntities: number;
        byType: Record<EntityType, number>;
    };
}
export interface ValidateEntitiesRequest {
    text: string;
    regexEntities: Entity[];
    maskList: MaskKeyword[];
}
export interface ValidateEntitiesResponse {
    entities: Entity[];
}
