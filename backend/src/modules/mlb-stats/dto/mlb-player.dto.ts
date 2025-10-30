/**
 * MLB-StatsAPI Player Response DTOs
 * Based on https://statsapi.mlb.com/api/v1 endpoints
 */

export interface MlbTeamDto {
  id: number;
  name: string;
}

export interface MlbPositionDto {
  code: string;
  name: string;
  type: string;
  abbreviation?: string;
}

export interface MlbSideDto {
  code: string;
  description?: string;
}

export interface MlbPlayerDto {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  primaryNumber?: string;
  currentTeam?: MlbTeamDto;
  primaryPosition?: MlbPositionDto;
  batSide?: MlbSideDto;
  pitchHand?: MlbSideDto;
  active: boolean;
}

export interface MlbPeopleResponseDto {
  people: MlbPlayerDto[];
}
