import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single category's contribution to the total score
 */
export class CategoryScoreDto {
  @ApiProperty({
    description: 'Name of the statistical category',
    example: 'homeRuns',
  })
  categoryName: string;

  @ApiProperty({
    description: 'The actual statistical value for this category',
    example: 42,
  })
  statValue: number;

  @ApiProperty({
    description: 'Points earned for this category (statValue * weight)',
    example: 168,
  })
  points: number;

  @ApiProperty({
    description: 'Point weight from scoring configuration',
    example: 4.0,
  })
  weight: number;
}

/**
 * DTO for detailed score breakdown of a player
 */
export class ScoreBreakdownDto {
  @ApiProperty({
    description: 'Player ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  playerId: string;

  @ApiProperty({
    description: 'Total calculated score',
    example: 456.5,
  })
  totalScore: number;

  @ApiProperty({
    description: 'Breakdown by category',
    type: [CategoryScoreDto],
  })
  categoryScores: CategoryScoreDto[];

  @ApiProperty({
    description: 'Type of statistics used (hitting or pitching)',
    example: 'hitting',
  })
  statisticType: string;
}
