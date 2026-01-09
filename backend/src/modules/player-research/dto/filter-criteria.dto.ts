import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';

/**
 * Statistic Type Enum - hitting or pitching
 */
export enum StatisticType {
  HITTING = 'hitting',
  PITCHING = 'pitching',
}

/**
 * Player Status Enum
 */
export enum PlayerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
}

/**
 * Date Range DTO
 */
export class DateRangeDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics (ISO format, null = season start)',
    example: '2024-04-01',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  from: string | null;

  @ApiPropertyOptional({
    description: 'End date for statistics (ISO format, null = current date)',
    example: '2024-10-31',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  to: string | null;
}

/**
 * Filter Criteria DTO - filterVersion 2 schema
 *
 * Represents the filter parameters for player research queries.
 * This aligns with the frontend FilterCriteria interface and SavedSearch filters schema.
 */
export class FilterCriteriaDto {
  @ApiProperty({
    description: 'Statistic type to filter players by',
    enum: StatisticType,
    example: StatisticType.HITTING,
  })
  @IsEnum(StatisticType)
  statisticType: StatisticType;

  @ApiProperty({
    description: 'Array of selected positions (empty array = all positions)',
    type: [String],
    example: ['1B', '2B', 'SS'],
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  positions: string[];

  @ApiProperty({
    description: 'Season year',
    example: 2024,
    minimum: 1900,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  season: number;

  @ApiProperty({
    description: 'Player status filter',
    enum: PlayerStatus,
    example: PlayerStatus.ACTIVE,
  })
  @IsEnum(PlayerStatus)
  status: PlayerStatus;

  @ApiProperty({
    description: 'Date range for statistics (null values use defaults)',
    type: DateRangeDto,
  })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;
}

/**
 * Default Filter Values
 */
export const DEFAULT_FILTERS: FilterCriteriaDto = {
  statisticType: StatisticType.HITTING,
  positions: [],
  season: new Date().getFullYear(),
  status: PlayerStatus.ACTIVE,
  dateRange: {
    from: null,
    to: null,
  },
};
