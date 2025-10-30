import { Module } from '@nestjs/common';
import { PlayerResearchService } from './player-research.service';
import { PlayerResearchController } from './player-research.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [PrismaModule, PlayersModule],
  controllers: [PlayerResearchController],
  providers: [PlayerResearchService],
  exports: [PlayerResearchService],
})
export class PlayerResearchModule {}
