import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { PlayerStatsRefreshService } from './jobs/player-stats-refresh.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MlbStatsModule } from '../mlb-stats/mlb-stats.module';
import { ScoringConfigsModule } from '../scoring-configs/scoring-configs.module';
import { ScoreCalculationService } from '../player-research/services/score-calculation.service';

@Module({
  imports: [PrismaModule, MlbStatsModule, ScoringConfigsModule],
  controllers: [PlayersController],
  providers: [PlayersService, PlayerStatsRefreshService, ScoreCalculationService],
  exports: [PlayersService, ScoreCalculationService],
})
export class PlayersModule {}
