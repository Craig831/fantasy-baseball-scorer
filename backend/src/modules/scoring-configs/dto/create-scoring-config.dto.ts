import { IsString, IsNotEmpty, IsObject, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScoringConfigDto {
  @ApiProperty({ example: 'PPR League 2025', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Scoring categories with batting and pitching stats',
    example: {
      batting: { hits: 1.0, homeRuns: 4.0, rbis: 1.0 },
      pitching: { wins: 5.0, strikeouts: 1.0, saves: 5.0 }
    }
  })
  @IsObject()
  categories: {
    batting: Record<string, number>;
    pitching: Record<string, number>;
  };

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
