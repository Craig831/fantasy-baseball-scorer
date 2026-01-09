import { Injectable } from '@nestjs/common';

/**
 * Column Configuration Interface
 */
export interface ColumnConfig {
  key: string;
  label: string;
  statKey?: string;
  sortable: boolean;
  sticky?: boolean;
}

/**
 * Scoring Configuration Interface (simplified)
 */
export interface ScoringConfig {
  categories: {
    hitting?: Record<string, number>;
    pitching?: Record<string, number>;
  };
}

/**
 * Column Configuration Service
 *
 * Determines which columns to display based on the active scoring configuration.
 * Only statistics that are included in the scoring config should be shown.
 */
@Injectable()
export class ColumnConfigurationService {
  /**
   * Base columns (always shown)
   */
  private readonly BASE_COLUMNS: ColumnConfig[] = [
    { key: 'playerName', label: 'Player', sortable: true, sticky: true },
    { key: 'position', label: 'Pos', sortable: true, sticky: true },
    { key: 'teamAbbr', label: 'Team', sortable: true, sticky: true },
    { key: 'totalPoints', label: 'PTS', sortable: true },
    { key: 'pointsPerGame', label: 'PPG', sortable: true },
  ];

  /**
   * All possible batter stat columns
   */
  private readonly BATTER_STAT_COLUMNS: ColumnConfig[] = [
    { key: 'gp', label: 'GP', statKey: 'gp', sortable: true },
    { key: 'ab', label: 'AB', statKey: 'ab', sortable: true },
    { key: 'h', label: 'H', statKey: 'h', sortable: true },
    { key: '2b', label: '2B', statKey: '2b', sortable: true },
    { key: '3b', label: '3B', statKey: '3b', sortable: true },
    { key: 'hr', label: 'HR', statKey: 'hr', sortable: true },
    { key: 'r', label: 'R', statKey: 'r', sortable: true },
    { key: 'rbi', label: 'RBI', statKey: 'rbi', sortable: true },
    { key: 'bb', label: 'BB', statKey: 'bb', sortable: true },
    { key: 'k', label: 'K', statKey: 'k', sortable: true },
    { key: 'sb', label: 'SB', statKey: 'sb', sortable: true },
    { key: 'cs', label: 'CS', statKey: 'cs', sortable: true },
  ];

  /**
   * All possible pitcher stat columns
   */
  private readonly PITCHER_STAT_COLUMNS: ColumnConfig[] = [
    { key: 'gp', label: 'GP', statKey: 'gp', sortable: true },
    { key: 'gs', label: 'GS', statKey: 'gs', sortable: true },
    { key: 'w', label: 'W', statKey: 'w', sortable: true },
    { key: 'l', label: 'L', statKey: 'l', sortable: true },
    { key: 's', label: 'S', statKey: 's', sortable: true },
    { key: 'h', label: 'H', statKey: 'h_pitcher', sortable: true },
    { key: 'er', label: 'ER', statKey: 'er', sortable: true },
    { key: 'bb', label: 'BB', statKey: 'bb', sortable: true },
    { key: 'k', label: 'K', statKey: 'k', sortable: true },
  ];

  /**
   * Get columns for a specific statistic type based on scoring configuration
   *
   * @param statisticType - 'hitting' or 'pitching'
   * @param scoringConfig - The active scoring configuration (optional)
   * @returns Array of columns to display
   */
  getColumnsForType(
    statisticType: 'hitting' | 'pitching',
    scoringConfig?: ScoringConfig,
  ): ColumnConfig[] {
    const columns = [...this.BASE_COLUMNS];

    // If no scoring config provided, return just base columns
    if (!scoringConfig) {
      return columns;
    }

    // Get all stat columns for this type
    const allStatColumns =
      statisticType === 'hitting'
        ? this.BATTER_STAT_COLUMNS
        : this.PITCHER_STAT_COLUMNS;

    // Get the scoring categories for this type
    const scoringCategories =
      statisticType === 'hitting'
        ? scoringConfig.categories.hitting
        : scoringConfig.categories.pitching;

    // If no scoring categories, return just base columns
    if (!scoringCategories) {
      return columns;
    }

    // Filter stat columns to only those in the scoring config
    const filteredStatColumns = allStatColumns.filter((column) => {
      // Games played is always included
      if (column.statKey === 'gp') {
        return true;
      }
      // Check if this stat is in the scoring configuration
      return column.statKey && scoringCategories[column.statKey] !== undefined;
    });

    // Return base columns + filtered stat columns
    return [...columns, ...filteredStatColumns];
  }

  /**
   * Get all base columns (always shown regardless of scoring config)
   */
  getBaseColumns(): ColumnConfig[] {
    return [...this.BASE_COLUMNS];
  }

  /**
   * Get all batter stat columns (for reference/testing)
   */
  getAllBatterColumns(): ColumnConfig[] {
    return [...this.BATTER_STAT_COLUMNS];
  }

  /**
   * Get all pitcher stat columns (for reference/testing)
   */
  getAllPitcherColumns(): ColumnConfig[] {
    return [...this.PITCHER_STAT_COLUMNS];
  }

  /**
   * Filter player statistics to only include columns in scoring config
   *
   * @param statistics - Raw player statistics object
   * @param statisticType - 'hitting' or 'pitching'
   * @param scoringConfig - The active scoring configuration (optional)
   * @returns Filtered statistics object
   */
  filterStatistics(
    statistics: Record<string, number>,
    statisticType: 'hitting' | 'pitching',
    scoringConfig?: ScoringConfig,
  ): Record<string, number> {
    // If no scoring config, return empty object
    if (!scoringConfig) {
      return {};
    }

    const columns = this.getColumnsForType(statisticType, scoringConfig);
    const filtered: Record<string, number> = {};

    // Include only statistics that have corresponding columns
    columns.forEach((column) => {
      if (column.statKey && statistics[column.statKey] !== undefined) {
        filtered[column.statKey] = statistics[column.statKey];
      }
    });

    return filtered;
  }
}
