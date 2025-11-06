import { ApiProperty } from '@nestjs/swagger';
import { Team as PrismaTeam } from '@prisma/client';

/**
 * Team entity representing an MLB team
 */
export class Team implements Partial<PrismaTeam> {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'MLB team ID from MLB-StatsAPI',
    example: 119,
  })
  mlbTeamId: number;

  @ApiProperty({
    description: 'Team full name',
    example: 'Los Angeles Dodgers',
  })
  name: string;

  @ApiProperty({
    description: 'Team abbreviation',
    example: 'LAD',
  })
  abbreviation: string;

  @ApiProperty({
    description: 'League (AL or NL)',
    example: 'NL',
    enum: ['AL', 'NL'],
  })
  league: string;

  @ApiProperty({
    description: 'Division',
    example: 'West',
  })
  division: string;

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
