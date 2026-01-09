import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SearchPlayersDto, StatisticType, PlayerStatus } from './dto/search-players.dto';
import { ScoreCalculationService } from './services/score-calculation.service';
import { ColumnConfigurationService } from './services/column-configuration.service';

@Injectable()
export class PlayerResearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreCalculation: ScoreCalculationService,
    private readonly columnConfig: ColumnConfigurationService,
  ) {}

  /**
   * Build query where clause based on filter parameters
   * Supports filterVersion 2: statisticType, positions array, season, status, dateRange
   */
  buildFilterWhereClause(filters: SearchPlayersDto): Prisma.PlayerWhereInput {
    const where: Prisma.PlayerWhereInput = {};

    // T011: Handle statisticType filter (hitting or pitching)
    if (filters.statisticType) {
      // For hitting: filter out pitchers (P)
      // For pitching: only include pitchers (P)
      if (filters.statisticType === StatisticType.HITTING) {
        where.position = {
          not: 'P',
        };
      } else if (filters.statisticType === StatisticType.PITCHING) {
        where.position = 'P';
      }
    }

    // T012: Handle positions array filter (empty array = all positions)
    if (filters.positions && filters.positions.length > 0) {
      where.position = {
        in: filters.positions,
      };
    }

    // T013: Handle season filter
    if (filters.season) {
      where.season = filters.season;
    }

    // Handle status filter
    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  /**
   * Build query for player statistics based on date range
   *
   * NOTE: Do NOT filter by filters.statisticType here.
   * - filters.statisticType = 'hitting'|'pitching' (player position type from filter panel)
   * - PlayerStatistic.statisticType was removed from schema (date filtering is sufficient)
   * Player type filtering happens in buildFilterWhereClause
   * by filtering on player.position (P for pitchers, everything else for batters).
   */
  buildStatisticsFilter(filters: SearchPlayersDto): Prisma.PlayerStatisticWhereInput {
    const where: Prisma.PlayerStatisticWhereInput = {};

    // Handle date range filter
    if (filters.dateFrom) {
      where.dateFrom = {
        gte: new Date(filters.dateFrom),
      };
    }

    if (filters.dateTo) {
      where.dateTo = {
        lte: new Date(filters.dateTo),
      };
    }

    // Match season if provided
    if (filters.season) {
      where.season = filters.season;
    }

    // REMOVED: Don't filter statistics by filters.statisticType
    // The statisticType field was removed from the database schema.
    // Player type filtering (hitting/pitching) is handled
    // by the main player WHERE clause in buildFilterWhereClause.

    return where;
  }

  /**
   * Search players with filters and pagination
   * Supports scoring when scoringConfigId is provided
   */
  async searchPlayers(filters: SearchPlayersDto, userId: string) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where = this.buildFilterWhereClause(filters);
    const statisticsWhere = this.buildStatisticsFilter(filters);

    // Build include for statistics
    const include: Prisma.PlayerInclude = {
      team: true,
      statistics: {
        where: statisticsWhere,
        orderBy: {
          dateFrom: 'desc',
        },
        take: 1, // Get most recent statistics
      },
    };

    // Execute query
    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: this.buildOrderBy(filters),
      }),
      this.prisma.player.count({ where }),
    ]);

    // Fetch scoring config if provided
    let scoringConfig: { id: string; categories: any } | null = null;
    if (filters.scoringConfigId) {
      scoringConfig = await this.prisma.scoringConfiguration.findUnique({
        where: { id: filters.scoringConfigId },
        select: {
          id: true,
          categories: true,
        },
      });
    }

    // T019: Transform players to include teamAbbr, formatted names, statistics, and scores
    const transformedPlayers = players.map((player) => {
      const base = this.transformPlayerResponse(player);

      // ALWAYS transform statistics to short codes (required by frontend)
      const transformedStats = this.extractAndTransformStatistics(player);

      // Calculate scores if scoring config provided
      if (scoringConfig) {
        const scoreData = this.calculatePlayerScores(player, scoringConfig, filters.statisticType);
        return {
          ...base,
          statistics: transformedStats,      // ← Always include transformed stats
          totalPoints: scoreData.totalPoints,  // ← Only include when scoring config
          pointsPerGame: scoreData.pointsPerGame,
        };
      }

      // No scoring config: include stats with null scores (matches PlayerResult interface)
      return {
        ...base,
        statistics: transformedStats,
        totalPoints: null,      // ← ALWAYS include, set to null when no config
        pointsPerGame: null,    // ← ALWAYS include, set to null when no config
      };
    });

    return { players: transformedPlayers, total };
  }

  /**
   * T050-T051: Calculate player scores (totalPoints and pointsPerGame)
   * T053: Filter statistics to only include scored stats
   */
  private calculatePlayerScores(player: any, scoringConfig: any, statisticType?: string) {
    // Calculate score using the score calculation service
    const scoreBreakdown = this.scoreCalculation.calculatePlayerScore(player, scoringConfig);

    if (!scoreBreakdown) {
      return {
        totalPoints: null,
        pointsPerGame: null,
        statistics: null,
      };
    }

    // Get games played for PPG calculation
    const stats = player.statistics?.[0];
    const gamesPlayed = stats?.statistics?.gp || stats?.statistics?.gamesPlayed || 0;

    // Calculate points per game
    const pointsPerGame = gamesPlayed > 0 ? scoreBreakdown.totalScore / gamesPlayed : 0;

    // Note: Statistics transformation now happens in searchPlayers()
    // This method just returns scoring metrics
    return {
      totalPoints: scoreBreakdown.totalScore,
      pointsPerGame: Math.round(pointsPerGame * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Transform statistics from MLB API long format to short codes
   * Maps: gamesPlayed -> gp, atBats -> ab, homeRuns -> hr, etc.
   */
  private transformStatisticsToShortCodes(stats: any): Record<string, number> {
    const mapping: Record<string, string> = {
      // Hitting stats
      gamesPlayed: 'gp',
      atBats: 'ab',
      hits: 'h',
      doubles: '2b',
      triples: '3b',
      homeRuns: 'hr',
      runs: 'r',
      rbi: 'rbi',
      baseOnBalls: 'bb',
      strikeOuts: 'k',
      stolenBases: 'sb',
      caughtStealing: 'cs',
      // Pitching stats
      gamesStarted: 'gs',
      wins: 'w',
      losses: 'l',
      saves: 's',
      holds: 'h_pitcher',
      earnedRuns: 'er',
    };

    const transformed: Record<string, number> = {};

    // Copy over stats that are already in short format
    Object.keys(stats).forEach((key) => {
      if (typeof stats[key] === 'number') {
        // If already in short format, use as-is
        transformed[key] = stats[key];
      }
    });

    // Transform long format to short format
    Object.keys(mapping).forEach((longKey) => {
      if (stats[longKey] !== undefined) {
        const shortKey = mapping[longKey];
        transformed[shortKey] = stats[longKey];
      }
    });

    return transformed;
  }

  /**
   * Extract and transform player statistics from Prisma result
   * Converts nested array structure to flat object with short codes
   */
  private extractAndTransformStatistics(player: any): Record<string, number> | null {
    const statsArray = player.statistics;

    if (!statsArray || statsArray.length === 0) {
      return null;
    }

    const rawStats = statsArray[0]?.statistics;

    if (!rawStats) {
      return null;
    }

    return this.transformStatisticsToShortCodes(rawStats);
  }

  /**
   * T019: Transform player data to include teamAbbr and formatted name
   */
  private transformPlayerResponse(player: any) {
    return {
      ...player,
      name: this.formatPlayerName(player.name),
      teamAbbr: player.team ? this.mapTeamToAbbreviation(player.team.name) : '',
    };
  }

  /**
   * Build order by clause based on sort parameters
   */
  private buildOrderBy(filters: SearchPlayersDto): Prisma.PlayerOrderByWithRelationInput {
    const sortOrder = filters.sortOrder || 'desc';

    switch (filters.sortBy) {
      case 'name':
        return { name: sortOrder };
      case 'position':
        return { position: sortOrder };
      case 'team':
        return { team: { name: sortOrder } };
      case 'season':
        return { season: sortOrder };
      case 'status':
        return { status: sortOrder };
      default:
        return { name: 'asc' }; // Default sort by name
    }
  }

  /**
   * T014: Map full team name to 3-letter abbreviation
   * Maps MLB team names to their standard 3-letter codes
   */
  mapTeamToAbbreviation(teamName: string): string {
    const teamAbbreviations: Record<string, string> = {
      'Arizona Diamondbacks': 'ARI',
      'Atlanta Braves': 'ATL',
      'Baltimore Orioles': 'BAL',
      'Boston Red Sox': 'BOS',
      'Chicago Cubs': 'CHC',
      'Chicago White Sox': 'CHW',
      'Cincinnati Reds': 'CIN',
      'Cleveland Guardians': 'CLE',
      'Colorado Rockies': 'COL',
      'Detroit Tigers': 'DET',
      'Houston Astros': 'HOU',
      'Kansas City Royals': 'KC',
      'Los Angeles Angels': 'LAA',
      'Los Angeles Dodgers': 'LAD',
      'Miami Marlins': 'MIA',
      'Milwaukee Brewers': 'MIL',
      'Minnesota Twins': 'MIN',
      'New York Mets': 'NYM',
      'New York Yankees': 'NYY',
      'Oakland Athletics': 'OAK',
      'Philadelphia Phillies': 'PHI',
      'Pittsburgh Pirates': 'PIT',
      'San Diego Padres': 'SD',
      'San Francisco Giants': 'SF',
      'Seattle Mariners': 'SEA',
      'St. Louis Cardinals': 'STL',
      'Tampa Bay Rays': 'TB',
      'Texas Rangers': 'TEX',
      'Toronto Blue Jays': 'TOR',
      'Washington Nationals': 'WSH',
    };

    return teamAbbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
  }

  /**
   * T015: Format player name as "Lastname, Firstname"
   * Handles various name formats and edge cases
   */
  formatPlayerName(fullName: string): string {
    // If already in "Lastname, Firstname" format, return as-is
    if (fullName.includes(',')) {
      return fullName;
    }

    // Split on spaces
    const parts = fullName.trim().split(' ');

    // Handle single name (just return as-is)
    if (parts.length === 1) {
      return fullName;
    }

    // Handle "Firstname Lastname" format
    // Last part is lastname, everything else is firstname
    const lastname = parts[parts.length - 1];
    const firstname = parts.slice(0, -1).join(' ');

    return `${lastname}, ${firstname}`;
  }

  // Additional service methods for saved searches will be implemented in Phase 5
}
