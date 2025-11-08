/**
 * DTO for creating a new lineup
 * Lineups are NOT tied to a scoring configuration
 * Scores are calculated using the user's current active config
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLineupDto {
  @ApiProperty({
    example: 'My Dream Team',
    description: 'Lineup name (1-100 characters)',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: '2025-04-15',
    description: 'Game date for this lineup (optional)',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  gameDate?: string;
}
