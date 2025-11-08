import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Player as PrismaPlayer } from '@prisma/client';
import { Team } from './team.entity';

/**
 * Player entity representing a baseball player
 */
export class Player implements Partial<PrismaPlayer> {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'MLB player ID from MLB-StatsAPI',
    example: 660271,
  })
  mlbPlayerId: number;

  @ApiProperty({
    description: 'Player full name',
    example: 'Shohei Ohtani',
  })
  name: string;

  @ApiProperty({
    description: 'Team ID reference',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  teamId: string;

  @ApiPropertyOptional({
    description: 'Team information (populated when included)',
    type: () => Team,
  })
  team?: Team;

  @ApiProperty({
    description: 'Primary position',
    example: 'DH',
  })
  position: string;

  @ApiProperty({
    description: 'Player status',
    example: 'active',
    enum: ['active', 'inactive', 'injured'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Jersey number',
    example: 17,
  })
  jerseyNumber?: number | null;

  @ApiProperty({
    description: 'Season year',
    example: 2024,
  })
  season: number;

  @ApiProperty({
    description: 'Last time player data was updated',
    example: '2024-10-30T12:00:00.000Z',
  })
  lastUpdated: Date;

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

  @ApiPropertyOptional({
    description: 'Calculated score based on scoring configuration (if provided)',
    example: 456.5,
  })
  score?: number;
}
