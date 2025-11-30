import { Request } from 'express';
import { DeidService } from './deid.service';
import { AuthService } from '../auth/auth.service';
import { ProcessRequest, ValidateEntitiesRequest } from './types';
interface AuthenticatedRequest extends Request {
    user?: {
        userID: string;
        email: string;
    };
}
export declare class DeidController {
    private deidService;
    private authService;
    constructor(deidService: DeidService, authService: AuthService);
    process(body: ProcessRequest): Promise<import("./types").ProcessResponse>;
    processWithLLM(body: ProcessRequest): Promise<import("./types").ProcessResponse>;
    validateEntities(body: ValidateEntitiesRequest): Promise<import("./types").ValidateEntitiesResponse>;
    listMaskKeywords(req: AuthenticatedRequest): Promise<{
        keywords: {
            id: number;
            keyword: string;
            entityType: import("./types").EntityType;
            userId: string;
        }[];
    }>;
    createMaskKeyword(req: AuthenticatedRequest, body: {
        keyword: string;
        entityType: string;
    }): Promise<{
        keyword: {
            id: number;
            keyword: string;
            entityType: import("./types").EntityType;
            userId: string;
        };
    }>;
    updateMaskKeyword(req: AuthenticatedRequest, id: string, body: {
        keyword: string;
        entityType: string;
    }): Promise<{
        success: boolean;
    }>;
    deleteMaskKeyword(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
export {};
