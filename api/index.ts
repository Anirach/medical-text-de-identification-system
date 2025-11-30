// Vercel serverless function entry point
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../backend/src/app.module';
import cookieParser from 'cookie-parser';
import { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response } from 'express';

let cachedApp: any;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  app.use(cookieParser());
  
  // Handle favicon.ico requests
  app.use('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
  });
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });
  
  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await bootstrap();
  app(req, res);
}

