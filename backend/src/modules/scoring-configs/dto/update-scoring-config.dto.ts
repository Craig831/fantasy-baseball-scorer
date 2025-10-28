import { PartialType } from '@nestjs/swagger';
import { CreateScoringConfigDto } from './create-scoring-config.dto';

export class UpdateScoringConfigDto extends PartialType(CreateScoringConfigDto) {}
