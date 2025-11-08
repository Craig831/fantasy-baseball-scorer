import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Player } from '../../players/entities/player.entity';

export enum PlayerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INJURED = 'injured',
}

/**
 * DTO for searching and filtering players
 */
export class SearchPlayersDto {
  @ApiPropertyOptional({
    description: 'Filter by positions (e.g., ["P", "DH", "1B"])',
    example: ['P', 'DH'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  position?: string[];

  @ApiPropertyOptional({
    description: 'Filter by league (AL, NL, or both)',
    example: 'both',
    enum: ['both', 'AL', 'NL'],
  })
  @IsOptional()
  @IsString()
  league?: string;

  @ApiPropertyOptional({
    description: 'Filter by player status',
    example: 'active',
    enum: PlayerStatus,
  })
  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;

  @ApiPropertyOptional({
    description: 'Filter by season year',
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  season?: number;

  @ApiPropertyOptional({
    description: 'Filter statistics from this date (ISO format)',
    example: '2024-04-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter statistics to this date (ISO format)',
    example: '2024-10-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Scoring configuration ID to calculate player scores',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  scoringConfigId?: string;

  @ApiPropertyOptional({
    description: 'Statistic type filter (hitting or pitching)',
    example: 'hitting',
    enum: ['hitting', 'pitching'],
  })
  @IsOptional()
  @IsString()
  statisticType?: string;

  @ApiPropertyOptional({
    description: 'Sort field (score, name, position, team, season, status)',
    example: 'score',
    enum: ['score', 'name', 'position', 'team', 'season', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Response DTO for paginated player search results
 */
export class SearchPlayersResponseDto {
  @ApiProperty({
    description: 'List of players matching the search criteria',
    type: [Player],
  })
  players: Player[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
