import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlayerResearchService } from './player-research.service';
import { PlayersService } from '../players/players.service';
import { SearchPlayersDto, SearchPlayersResponseDto } from './dto/search-players.dto';
import { Player } from '../players/entities/player.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('player-research')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayerResearchController {
  constructor(
    private readonly playerResearchService: PlayerResearchService,
    private readonly playersService: PlayersService,
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
    @Query() filters: SearchPlayersDto,
  ): Promise<SearchPlayersResponseDto> {
    const { players, total } = await this.playersService.findAll(filters);

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
