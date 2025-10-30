import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { PlayerStatsRefreshService } from './jobs/player-stats-refresh.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MlbStatsModule } from '../mlb-stats/mlb-stats.module';

@Module({
  imports: [PrismaModule, MlbStatsModule],
  controllers: [PlayersController],
  providers: [PlayersService, PlayerStatsRefreshService],
  exports: [PlayersService],
})
export class PlayersModule {}
