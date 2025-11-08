/**
 * Lineups Module
 * Manages player lineup creation and scoring
 * Lineups are NOT tied to scoring configs - scores calculated dynamically
 */

import { Module } from '@nestjs/common';
import { LineupsController } from './lineups.controller';
import { LineupsService } from './lineups.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LineupsController],
  providers: [LineupsService],
  exports: [LineupsService],
})
export class LineupsModule {}
