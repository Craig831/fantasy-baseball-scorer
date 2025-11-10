import { Module } from '@nestjs/common';
import { PlayerResearchService } from './player-research.service';
import { PlayerResearchController } from './player-research.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlayersModule } from '../players/players.module';
import { ScoringConfigsModule } from '../scoring-configs/scoring-configs.module';
import { ScoreCalculationService } from './services/score-calculation.service';
import { ColumnConfigurationService } from './services/column-configuration.service';

@Module({
  imports: [PrismaModule, PlayersModule, ScoringConfigsModule],
  controllers: [PlayerResearchController],
  providers: [PlayerResearchService, ScoreCalculationService, ColumnConfigurationService],
  exports: [PlayerResearchService, ScoreCalculationService, ColumnConfigurationService],
})
export class PlayerResearchModule {}
