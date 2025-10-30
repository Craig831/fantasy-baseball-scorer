/**
 * Frontend TypeScript types for Player Research feature
 * Aligned with backend Prisma models
 */

export interface Player {
  id: string;
  mlbPlayerId: number;
  name: string;
  team: string;
  position: string;
  status: string;
  jerseyNumber?: number;
  season: number;
  lastUpdated: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PlayerStatistic {
  id: string;
  playerId: string;
  season: number;
  statisticType: string; // 'hitting' or 'pitching'
  statistics: BattingStats | PitchingStats;
  dateFrom: string; // ISO date string
  dateTo: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface BattingStats {
  gamesPlayed?: number;
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbi?: number;
  stolenBases?: number;
  caughtStealing?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  avg?: string;
  obp?: string;
  slg?: string;
  ops?: string;
}

export interface PitchingStats {
  gamesPlayed?: number;
  gamesStarted?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  saveOpportunities?: number;
  holds?: number;
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  homeRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  era?: string;
  whip?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: PlayerSearchFilters;
  scoringConfigurationId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PlayerSearchFilters {
  position?: string[];
  team?: string[];
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  status?: string;
  season?: number;
}

export interface PlayerWithScore extends Player {
  score?: number;
  statistics?: PlayerStatistic[];
}

export interface ScoreBreakdown {
  playerId: string;
  totalScore: number;
  categoryScores: CategoryScore[];
  statisticType: string;
}

export interface CategoryScore {
  categoryName: string;
  statValue: number;
  points: number;
  weight: number;
}
