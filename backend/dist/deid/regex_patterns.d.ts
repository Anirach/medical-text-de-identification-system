import { Entity, EntityType, MaskKeyword } from "./types";
export declare function detectEntitiesWithRegex(text: string, enabledTypes: EntityType[], customMaskList: MaskKeyword[]): Entity[];
