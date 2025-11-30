import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessRequest, ProcessResponse, EntityType, ValidateEntitiesRequest, ValidateEntitiesResponse } from './types';
export declare class DeidService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    process(req: ProcessRequest): Promise<ProcessResponse>;
    processWithLLM(req: ProcessRequest): Promise<ProcessResponse>;
    validateEntities(req: ValidateEntitiesRequest): Promise<ValidateEntitiesResponse>;
    listMaskKeywords(userId: string): Promise<{
        keywords: {
            id: number;
            keyword: string;
            entityType: EntityType;
            userId: string;
        }[];
    }>;
    createMaskKeyword(userId: string, keyword: string, entityType: string): Promise<{
        keyword: {
            id: number;
            keyword: string;
            entityType: EntityType;
            userId: string;
        };
    }>;
    updateMaskKeyword(userId: string, id: number, keyword: string, entityType: string): Promise<void>;
    deleteMaskKeyword(userId: string, id: number): Promise<void>;
    private calculateStatistics;
    private buildValidationPrompt;
}
