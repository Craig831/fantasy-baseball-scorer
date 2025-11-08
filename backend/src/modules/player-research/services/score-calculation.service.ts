import { Injectable } from '@nestjs/common';
import { ScoreBreakdownDto, CategoryScoreDto } from '../dto/score-breakdown.dto';

interface ScoringConfig {
  id: string;
  categories: {
    batting: Record<string, number>;
    pitching: Record<string, number>;
  };
}

interface PlayerStatistic {
  statisticType: string;
  statistics: any; // JSONB field
}

interface PlayerWithStats {
  id: string;
  position: string;
  statistics: PlayerStatistic[];
}

@Injectable()
export class ScoreCalculationService {
  /**
   * Calculate player score using scoring configuration
   */
  calculatePlayerScore(
    player: PlayerWithStats,
    config: ScoringConfig,
  ): ScoreBreakdownDto | null {
    // No statistics available
    if (!player.statistics || player.statistics.length === 0) {
      return null;
    }

    // Determine statistic type based on position
    const isPitcher = player.position.toLowerCase().includes('pitcher') ||
                     player.position.toLowerCase() === 'p';
    const statisticType = isPitcher ? 'pitching' : 'batting';

    // Find matching statistics
    const stats = player.statistics.find(
      (s) => s.statisticType === statisticType,
    );

    if (!stats) {
      return null;
    }

    // Get relevant scoring categories
    const categories = isPitcher
      ? config.categories.pitching
      : config.categories.batting;

    // Calculate scores for each category
    const categoryScores: CategoryScoreDto[] = [];
    let totalScore = 0;

    for (const [categoryName, weight] of Object.entries(categories)) {
      // Get stat value from statistics JSONB
      const statValue = this.getStatValue(stats.statistics, categoryName);

      if (statValue !== null && statValue !== undefined) {
        const points = statValue * weight;
        totalScore += points;

        categoryScores.push({
          categoryName,
          statValue,
          points,
          weight,
        });
      }
    }

    return {
      playerId: player.id,
      totalScore,
      categoryScores,
      statisticType,
    };
  }

  /**
   * Calculate scores for multiple players
   */
  calculatePlayerScores(
    players: PlayerWithStats[],
    config: ScoringConfig,
  ): Map<string, number> {
    const scores = new Map<string, number>();

    for (const player of players) {
      const breakdown = this.calculatePlayerScore(player, config);
      if (breakdown) {
        scores.set(player.id, breakdown.totalScore);
      }
    }

    return scores;
  }

  /**
   * Extract stat value from statistics JSONB
   * Handles various stat name formats (camelCase, snake_case)
   */
  private getStatValue(statistics: any, categoryName: string): number | null {
    if (!statistics || typeof statistics !== 'object') {
      return null;
    }

    // Try direct match first
    if (categoryName in statistics) {
      return this.parseNumber(statistics[categoryName]);
    }

    // Try converting to camelCase
    const camelCase = this.toCamelCase(categoryName);
    if (camelCase in statistics) {
      return this.parseNumber(statistics[camelCase]);
    }

    // Try converting to snake_case
    const snakeCase = this.toSnakeCase(categoryName);
    if (snakeCase in statistics) {
      return this.parseNumber(statistics[snakeCase]);
    }

    return null;
  }

  /**
   * Parse number from various formats (number, string)
   */
  private parseNumber(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
