import { Module } from '@nestjs/common';
import { DeidController } from './deid.controller';
import { DeidService } from './deid.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DeidController],
  providers: [DeidService],
})
export class DeidModule {}

