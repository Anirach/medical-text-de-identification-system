import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { DeidService } from './deid.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { ProcessRequest, ValidateEntitiesRequest } from './types';

interface AuthenticatedRequest extends Request {
  user?: {
    userID: string;
    email: string;
  };
}

@Controller()
export class DeidController {
  constructor(
    private deidService: DeidService,
    private authService: AuthService,
  ) {}

  @Post('process')
  async process(@Body() body: ProcessRequest) {
    return this.deidService.process(body);
  }

  @Post('process-with-llm')
  async processWithLLM(@Body() body: ProcessRequest) {
    return this.deidService.processWithLLM(body);
  }

  @Post('validate-entities')
  @UseGuards(AuthGuard)
  async validateEntities(@Body() body: ValidateEntitiesRequest) {
    return this.deidService.validateEntities(body);
  }

  @Get('mask-keywords')
  @UseGuards(AuthGuard)
  async listMaskKeywords(@Req() req: AuthenticatedRequest) {
    return this.deidService.listMaskKeywords(req.user!.userID);
  }

  @Post('mask-keywords')
  @UseGuards(AuthGuard)
  async createMaskKeyword(
    @Req() req: AuthenticatedRequest,
    @Body() body: { keyword: string; entityType: string },
  ) {
    if (!body.keyword || !body.entityType) {
      throw new BadRequestException('keyword and entityType are required');
    }
    return this.deidService.createMaskKeyword(
      req.user!.userID,
      body.keyword,
      body.entityType,
    );
  }

  @Put('mask-keywords/:id')
  @UseGuards(AuthGuard)
  async updateMaskKeyword(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { keyword: string; entityType: string },
  ) {
    await this.deidService.updateMaskKeyword(
      req.user!.userID,
      parseInt(id, 10),
      body.keyword,
      body.entityType,
    );
    return { success: true };
  }

  @Delete('mask-keywords/:id')
  @UseGuards(AuthGuard)
  async deleteMaskKeyword(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.deidService.deleteMaskKeyword(req.user!.userID, parseInt(id, 10));
    return { success: true };
  }
}

