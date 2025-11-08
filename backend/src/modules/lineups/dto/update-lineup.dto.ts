/**
 * DTO for updating an existing lineup
 * Lineups are NOT tied to a scoring configuration
 * Scores are calculated using the user's current active config
 */

import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for a single lineup slot
 * Represents one position in the lineup (1-25)
 */
export class LineupSlotDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Slot position (1-25)',
    minimum: 1,
    maximum: 25,
  })
  @IsInt()
  @Min(1)
  @Max(25)
  slotOrder: number;

  @ApiPropertyOptional({
    example: 'player-uuid-123',
    description: 'Player ID for this slot (null to remove player)',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  playerId: string | null;
}

export class UpdateLineupDto {
  @ApiPropertyOptional({
    example: 'My Updated Dream Team',
    description: 'New lineup name (1-100 characters)',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Array of lineup slots to update',
    type: [LineupSlotDto],
    example: [
      { slotOrder: 1, playerId: 'player-uuid-123' },
      { slotOrder: 2, playerId: null },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupSlotDto)
  slots?: LineupSlotDto[];
}
