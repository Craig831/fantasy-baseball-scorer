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

    // Execute query with pagination
    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' }, // Active players first
          { name: 'asc' },
        ],
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
