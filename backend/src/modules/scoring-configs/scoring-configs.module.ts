import { Module } from '@nestjs/common';
import { ScoringConfigsController } from './scoring-configs.controller';
import { ScoringConfigsService } from './scoring-configs.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScoringConfigsController],
  providers: [ScoringConfigsService],
  exports: [ScoringConfigsService],
})
export class ScoringConfigsModule {}
