import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { MlbStatsService } from '../../mlb-stats/mlb-stats.service';

/**
 * Background job service for refreshing player statistics from MLB-StatsAPI
 *
 * Runs hourly during baseball season (9am-11pm daily)
 * Fetches latest statistics for all active players and updates database
 */
@Injectable()
export class PlayerStatsRefreshService {
  private readonly logger = new Logger(PlayerStatsRefreshService.name);
  private isRefreshing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlbStatsService: MlbStatsService,
  ) {}

  /**
   * Scheduled job to refresh player statistics hourly
   * Runs every hour from 9am to 11pm during the season
   */
  @Cron('0 9-23 * * *', {
    name: 'refresh-player-stats',
    timeZone: 'America/New_York', // MLB operates on Eastern Time
  })
  async refreshPlayerStats(): Promise<void> {
    // Prevent concurrent executions
    if (this.isRefreshing) {
      this.logger.warn('Refresh already in progress, skipping this run');
      return;
    }

    try {
      this.isRefreshing = true;
      this.logger.log('Starting player statistics refresh');

      const currentSeason = new Date().getFullYear();

      // Fetch all active players for current season
      const activePlayers = await this.prisma.player.findMany({
        where: {
          status: 'active',
          season: currentSeason,
        },
        select: {
          id: true,
          mlbPlayerId: true,
          position: true,
        },
      });

      this.logger.log(`Found ${activePlayers.length} active players for season ${currentSeason}`);

      let successCount = 0;
      let errorCount = 0;

      // Refresh statistics for each player
      for (const player of activePlayers) {
        try {
          await this.refreshPlayerStatsForPlayer(player.id, player.mlbPlayerId, currentSeason, player.position);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to refresh stats for player ${player.mlbPlayerId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Player statistics refresh complete. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(`Fatal error during player statistics refresh: ${error.message}`, error.stack);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Refresh statistics for a single player
   * @param playerId Internal player ID (UUID)
   * @param mlbPlayerId MLB API player ID
   * @param season Season year
   * @param position Player position to determine stat type
   */
  private async refreshPlayerStatsForPlayer(
    playerId: string,
    mlbPlayerId: number,
    season: number,
    position: string,
  ): Promise<void> {
    // Determine stat group based on position (pitchers vs hitters)
    const statGroup = position === 'P' ? 'pitching' : 'hitting';

    // Fetch statistics from MLB API
    const statsResponse = await this.mlbStatsService.fetchPlayerStats(
      mlbPlayerId,
      season,
      statGroup,
    );

    if (!statsResponse.stats || statsResponse.stats.length === 0) {
      this.logger.warn(`No statistics found for player ${mlbPlayerId} in season ${season}`);
      return;
    }

    // Extract season statistics
    const seasonStats = statsResponse.stats.find(
      (stat) => stat.type.displayName === 'season',
    );

    if (!seasonStats || !seasonStats.splits || seasonStats.splits.length === 0) {
      this.logger.warn(`No season statistics found for player ${mlbPlayerId}`);
      return;
    }

    const statSplit = seasonStats.splits[0];

    // Calculate date range for current season (assuming April 1 - October 31)
    const dateFrom = new Date(season, 3, 1); // April 1
    const dateTo = new Date(season, 9, 31); // October 31

    // Upsert player statistics
    await this.prisma.playerStatistic.upsert({
      where: {
        unique_player_season_stats: {
          playerId,
          season,
          dateFrom,
          dateTo,
        },
      },
      update: {
        statistics: statSplit.stat as any,
        updatedAt: new Date(),
      },
      create: {
        playerId,
        season,
        statistics: statSplit.stat as any,
        dateFrom,
        dateTo,
      },
    });

    this.logger.debug(`Updated ${statGroup} statistics for player ${mlbPlayerId}`);
  }

  /**
   * Manual trigger for testing purposes
   * Can be called from a controller or CLI command
   */
  async manualRefresh(): Promise<void> {
    this.logger.log('Manual player statistics refresh triggered');
    await this.refreshPlayerStats();
  }
}
