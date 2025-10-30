/**
 * MLB-StatsAPI Statistics Response DTOs
 * Based on https://statsapi.mlb.com/api/v1 statistics endpoints
 */

export interface MlbStatTypeDto {
  displayName: string;
}

export interface MlbStatGroupDto {
  displayName: string;
}

export interface MlbBattingStatsDto {
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

export interface MlbPitchingStatsDto {
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

export interface MlbStatSplitDto {
  season: string;
  stat: MlbBattingStatsDto | MlbPitchingStatsDto;
}

export interface MlbStatDto {
  type: MlbStatTypeDto;
  group: MlbStatGroupDto;
  splits: MlbStatSplitDto[];
}

export interface MlbStatsResponseDto {
  stats: MlbStatDto[];
}
