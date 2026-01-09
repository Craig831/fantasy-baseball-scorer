import { ApiProperty } from '@nestjs/swagger';
import { PlayerStatistic as PrismaPlayerStatistic } from '@prisma/client';

/**
 * PlayerStatistic entity representing player performance statistics
 */
export class PlayerStatistic implements Partial<PrismaPlayerStatistic> {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Player ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  playerId: string;

  @ApiProperty({
    description: 'Season year',
    example: 2024,
  })
  season: number;

  @ApiProperty({
    description: 'Statistics data (hitting or pitching)',
    example: {
      gamesPlayed: 157,
      atBats: 599,
      runs: 134,
      hits: 185,
      homeRuns: 54,
      rbi: 130,
      avg: '.310',
    },
  })
  statistics: any; // JSONB field

  @ApiProperty({
    description: 'Start date of statistics period',
    example: '2024-04-01',
  })
  dateFrom: Date;

  @ApiProperty({
    description: 'End date of statistics period',
    example: '2024-10-31',
  })
  dateTo: Date;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-10-30T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-10-30T12:00:00.000Z',
  })
  updatedAt: Date;
}
