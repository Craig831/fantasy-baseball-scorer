import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchPlayersDto } from '../player-research/dto/search-players.dto';
import { Player } from './entities/player.entity';
import { Prisma } from '@prisma/client';
import { ScoringConfigsService } from '../scoring-configs/scoring-configs.service';
import { ScoreCalculationService } from '../player-research/services/score-calculation.service';

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringConfigsService: ScoringConfigsService,
    private readonly scoreCalculationService: ScoreCalculationService,
  ) {}

  /**
   * Find all players with optional filtering and pagination
   * @param filters Search and filter criteria
   * @param userId User ID for scoring config lookup (optional)
   * @returns Paginated list of players and metadata
   */
  async findAll(
    filters: SearchPlayersDto,
    userId?: string,
  ): Promise<{
    players: Player[];
    total: number;
  }> {
    const {
      position,
      league,
      status,
      season,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      scoringConfigId,
      statisticType,
      sortBy,
      sortOrder = 'desc',
    } = filters;

    // Build where clause for Prisma
    const where: Prisma.PlayerWhereInput = {};

    // Filter by statistic type and position
    if (statisticType === 'hitting') {
      // For hitting, exclude pitchers unless specifically selected
      if (position && position.length > 0) {
        where.position = { in: position };
      } else {
        where.position = { notIn: ['P'] };
      }
    } else if (statisticType === 'pitching') {
      // For pitching, only include pitchers unless specifically selected
      if (position && position.length > 0) {
        where.position = { in: position };
      } else {
        where.position = { in: ['P'] };
      }
    }

    // Filter by league
    if (league && league !== 'both') {
      where.team = {
        league: league,
      };
    }

    if (status) {
      where.status = status;
    }

    if (season) {
      where.season = season;
    }

    // For date range filtering, we need to check if player has statistics in that range
    if (dateFrom || dateTo) {
      where.statistics = {
        some: {
          ...(dateFrom && { dateFrom: { gte: new Date(dateFrom) } }),
          ...(dateTo && { dateTo: { lte: new Date(dateTo) } }),
        },
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: Prisma.PlayerOrderByWithRelationInput[] = [];

    // If sorting by score, we'll handle it in-memory after score calculation
    // For other fields, sort at database level
    if (sortBy && sortBy !== 'score') {
      switch (sortBy) {
        case 'name':
          orderBy.push({ name: sortOrder });
          break;
        case 'position':
          orderBy.push({ position: sortOrder });
          break;
        case 'team':
          orderBy.push({ team: { name: sortOrder } });
          break;
        case 'season':
          orderBy.push({ season: sortOrder });
          break;
        case 'status':
          orderBy.push({ status: sortOrder });
          break;
        default:
          // Default sort
          orderBy.push({ status: 'asc' }, { name: 'asc' });
      }
    } else if (!sortBy) {
      // Default sort when no sortBy specified
      orderBy.push({ status: 'asc' }, { name: 'asc' });
    }
    // If sortBy === 'score', orderBy will be empty (sort in-memory later)

    // Execute query with pagination
    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip: sortBy === 'score' ? 0 : skip, // Fetch all for score sorting, paginate later
        take: sortBy === 'score' ? undefined : limit, // Fetch all for score sorting
        orderBy: orderBy.length > 0 ? orderBy : undefined,
        include: {
          team: true, // Include team information
          statistics: {
            where: {
              ...(dateFrom && { dateFrom: { gte: new Date(dateFrom) } }),
              ...(dateTo && { dateTo: { lte: new Date(dateTo) } }),
            },
            orderBy: { season: 'desc' },
            take: 1, // Get most recent statistics
          },
        },
      }),
      this.prisma.player.count({ where }),
    ]);

    // Calculate scores if scoring config is provided
    if (scoringConfigId && userId) {
      try {
        const config = await this.scoringConfigsService.findOne(
          userId,
          scoringConfigId,
        );

        // Calculate scores for all players
        const scores = this.scoreCalculationService.calculatePlayerScores(
          players as any,
          config as any,
        );

        // Add scores to player objects
        players.forEach((player) => {
          const score = scores.get(player.id);
          if (score !== undefined) {
            (player as any).score = score;
          }
        });
      } catch (error) {
        // If scoring config fetch fails, just return players without scores
        console.error('Failed to calculate scores:', error);
      }
    }

    // If sorting by score, sort in-memory and then paginate
    if (sortBy === 'score') {
      // Sort by score (handle null/undefined scores)
      players.sort((a, b) => {
        const scoreA = (a as any).score ?? -Infinity;
        const scoreB = (b as any).score ?? -Infinity;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });

      // Apply pagination after sorting
      const startIndex = skip;
      const endIndex = startIndex + limit;
      const paginatedPlayers = players.slice(startIndex, endIndex);

      return { players: paginatedPlayers, total };
    }

    return { players, total };
  }

  /**
   * Find a single player by ID
   * @param id Player UUID
   * @returns Player with statistics
   */
  async findOne(id: string): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        statistics: {
          orderBy: { season: 'desc' },
        },
      },
    });
  }

  /**
   * Get unique teams for filter dropdown
   * @returns List of unique team names
   */
  async getUniqueTeams(): Promise<string[]> {
    const teams = await this.prisma.team.findMany({
      orderBy: { name: 'asc' },
    });

    return teams.map((t) => t.name);
  }

  /**
   * Get unique positions for filter dropdown
   * @returns List of unique position codes
   */
  async getUniquePositions(): Promise<string[]> {
    const positions = await this.prisma.player.findMany({
      where: { status: 'active' },
      select: { position: true },
      distinct: ['position'],
      orderBy: { position: 'asc' },
    });

    return positions.map((p) => p.position);
  }
}
