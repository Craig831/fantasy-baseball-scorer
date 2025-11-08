import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MlbStatsService } from './mlb-stats.service';

@Module({
  imports: [HttpModule],
  providers: [MlbStatsService],
  exports: [MlbStatsService],
})
export class MlbStatsModule {}
