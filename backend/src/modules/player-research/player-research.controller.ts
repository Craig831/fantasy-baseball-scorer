import { Controller } from '@nestjs/common';
import { PlayerResearchService } from './player-research.service';

@Controller('player-research')
export class PlayerResearchController {
  constructor(private readonly playerResearchService: PlayerResearchService) {}

  // Controller endpoints for player search and saved searches will be implemented in Phases 3-5
}
