import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DeidModule } from './deid/deid.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      serveRoot: '/',
      exclude: ['/api*', '/auth*', '/process*', '/mask-keywords*', '/validate-entities*'],
    }),
    PrismaModule,
    AuthModule,
    DeidModule,
  ],
})
export class AppModule {}

