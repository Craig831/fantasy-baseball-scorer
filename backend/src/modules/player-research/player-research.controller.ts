import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlayerResearchService } from './player-research.service';
import { PlayersService } from '../players/players.service';
import { SearchPlayersDto, SearchPlayersResponseDto } from './dto/search-players.dto';
import { Player } from '../players/entities/player.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScoreCalculationService } from './services/score-calculation.service';
import { ScoreBreakdownDto } from './dto/score-breakdown.dto';
import { ScoringConfigsService } from '../scoring-configs/scoring-configs.service';

@ApiTags('player-research')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayerResearchController {
  constructor(
    private readonly playerResearchService: PlayerResearchService,
    private readonly playersService: PlayersService,
    private readonly scoreCalculationService: ScoreCalculationService,
    private readonly scoringConfigsService: ScoringConfigsService,
  ) {}

  /**
   * Search and filter players with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Search and filter players' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of players matching search criteria',
    type: SearchPlayersResponseDto,
  })
  async searchPlayers(
    @CurrentUser() user: any,
    @Query() filters: SearchPlayersDto,
  ): Promise<SearchPlayersResponseDto> {
    const { players, total } = await this.playerResearchService.searchPlayers(filters, user.id);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      players,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Get detailed score breakdown for a player
   */
  @Get(':id/score-breakdown')
  @ApiOperation({ summary: 'Get detailed score breakdown for a player' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed score breakdown',
    type: ScoreBreakdownDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Player or scoring configuration not found',
  })
  async getScoreBreakdown(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('scoringConfigId') scoringConfigId: string,
  ): Promise<ScoreBreakdownDto> {
    // Fetch player with statistics
    const player = await this.playersService.findOne(id);
    if (!player) {
      throw new Error('Player not found');
    }

    // Fetch scoring configuration
    const config = await this.scoringConfigsService.findOne(
      user.id,
      scoringConfigId,
    );

    // Calculate score breakdown
    const breakdown = this.scoreCalculationService.calculatePlayerScore(
      player as any,
      config as any,
    );

    if (!breakdown) {
      throw new Error('Unable to calculate score for this player');
    }

    return breakdown;
  }

  /**
   * Get a single player by ID with statistics
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get player details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns player details with statistics',
    type: Player,
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async getPlayer(@Param('id') id: string): Promise<Player> {
    const player = await this.playersService.findOne(id);

    if (!player) {
      throw new Error('Player not found');
    }

    return player;
  }

  /**
   * Get unique teams for filter dropdown
   */
  @Get('filters/teams')
  @ApiOperation({ summary: 'Get list of unique teams' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of unique team names',
    type: [String],
  })
  async getTeams(): Promise<string[]> {
    return this.playersService.getUniqueTeams();
  }

  /**
   * Get unique positions for filter dropdown
   */
  @Get('filters/positions')
  @ApiOperation({ summary: 'Get list of unique positions' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of unique position codes',
    type: [String],
  })
  async getPositions(): Promise<string[]> {
    return this.playersService.getUniquePositions();
  }
}
