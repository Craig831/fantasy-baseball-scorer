import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchPlayersDto } from '../player-research/dto/search-players.dto';
import { Player } from './entities/player.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all players with optional filtering and pagination
   * @param filters Search and filter criteria
   * @returns Paginated list of players and metadata
   */
  async findAll(filters: SearchPlayersDto): Promise<{
    players: Player[];
    total: number;
  }> {
    const {
      position,
      team,
      status,
      season,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = filters;

    // Build where clause for Prisma
    const where: Prisma.PlayerWhereInput = {};

    if (position && position.length > 0) {
      where.position = { in: position };
    }

    if (team && team.length > 0) {
      where.team = { in: team };
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
    const teams = await this.prisma.player.findMany({
      where: { status: 'active' },
      select: { team: true },
      distinct: ['team'],
      orderBy: { team: 'asc' },
    });

    return teams.map((t) => t.team);
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
