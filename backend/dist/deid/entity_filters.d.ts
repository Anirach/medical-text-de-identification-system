import { Entity } from "./types";
export declare function filterFalsePositives(entities: Entity[], text: string): Entity[];
export declare function mergeOverlappingEntities(entities: Entity[]): Entity[];
export declare function enhanceEntitiesWithContext(entities: Entity[], text: string): Entity[];
