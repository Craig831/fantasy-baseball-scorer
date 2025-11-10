import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsObject, IsDateString } from 'class-validator';

/**
 * Player Status Enum
 */
export enum PlayerStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
}

/**
 * Player Statistics DTO
 * Position-specific statistics, filtered by active scoring configuration
 */
export class PlayerStatisticsDto {
  @ApiPropertyOptional({
    description: 'Games Played',
    example: 162,
  })
  gp?: number;

  // Batter stats (only included if in scoring config)
  @ApiPropertyOptional({ description: 'At Bats', example: 550 })
  ab?: number;

  @ApiPropertyOptional({ description: 'Hits', example: 175 })
  h?: number;

  @ApiPropertyOptional({ description: 'Doubles', example: 35 })
  '2b'?: number;

  @ApiPropertyOptional({ description: 'Triples', example: 5 })
  '3b'?: number;

  @ApiPropertyOptional({ description: 'Home Runs', example: 30 })
  hr?: number;

  @ApiPropertyOptional({ description: 'Runs', example: 95 })
  r?: number;

  @ApiPropertyOptional({ description: 'RBIs', example: 100 })
  rbi?: number;

  @ApiPropertyOptional({ description: 'Walks (Base on Balls)', example: 60 })
  bb?: number;

  @ApiPropertyOptional({ description: 'Strikeouts', example: 120 })
  k?: number;

  @ApiPropertyOptional({ description: 'Stolen Bases', example: 20 })
  sb?: number;

  @ApiPropertyOptional({ description: 'Caught Stealing', example: 5 })
  cs?: number;

  // Pitcher stats (only included if in scoring config)
  @ApiPropertyOptional({ description: 'Games Started', example: 32 })
  gs?: number;

  @ApiPropertyOptional({ description: 'Wins', example: 15 })
  w?: number;

  @ApiPropertyOptional({ description: 'Losses', example: 8 })
  l?: number;

  @ApiPropertyOptional({ description: 'Saves', example: 0 })
  s?: number;

  @ApiPropertyOptional({ description: 'Holds', example: 0 })
  h_pitcher?: number;

  @ApiPropertyOptional({ description: 'Earned Runs', example: 75 })
  er?: number;

  // Allow additional stats
  [key: string]: number | undefined;
}

/**
 * Player Result DTO
 * Represents a player in search results with calculated scores
 *
 * Updated format per spec requirements:
 * - Player name formatted as "Lastname, Firstname"
 * - Team abbreviation (3-letter code like "NYY", "LAA", "COL")
 * - totalPoints and pointsPerGame instead of single score
 * - Statistics filtered by active scoring configuration
 */
export class PlayerResultDto {
  @ApiProperty({
    description: 'Internal player UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'MLB Player ID',
    example: 660271,
  })
  @IsNumber()
  mlbPlayerId: number;

  @ApiProperty({
    description: 'Player name formatted as "Lastname, Firstname"',
    example: 'Ohtani, Shohei',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Player position',
    example: 'DH',
  })
  @IsString()
  position: string;

  @ApiProperty({
    description: '3-letter team abbreviation',
    example: 'LAA',
  })
  @IsString()
  teamAbbr: string;

  @ApiProperty({
    description: 'Player status',
    enum: PlayerStatusEnum,
    example: PlayerStatusEnum.ACTIVE,
  })
  @IsEnum(PlayerStatusEnum)
  status: PlayerStatusEnum;

  @ApiProperty({
    description: 'Total calculated points (null if no scoring config)',
    example: 450.5,
    nullable: true,
  })
  @IsNumber()
  totalPoints: number | null;

  @ApiProperty({
    description: 'Points per game average (null if no config or 0 games)',
    example: 2.78,
    nullable: true,
  })
  @IsNumber()
  pointsPerGame: number | null;

  @ApiProperty({
    description: 'Position-specific statistics (only those in scoring config)',
    type: PlayerStatisticsDto,
  })
  @IsObject()
  statistics: PlayerStatisticsDto;

  @ApiProperty({
    description: 'Last updated timestamp (ISO 8601 format)',
    example: '2024-08-15T12:34:56.789Z',
  })
  @IsDateString()
  lastUpdated: string;
}

/**
 * Player Search Response DTO (paginated)
 */
export class PlayerSearchResponseDto {
  @ApiProperty({
    description: 'List of players matching search criteria',
    type: [PlayerResultDto],
  })
  data: PlayerResultDto[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({
    description: 'Response metadata',
  })
  meta: {
    lastUpdated: string;
    scoringConfigName: string;
  };
}
