import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlayerResearchService {
  constructor(private readonly prisma: PrismaService) {}

  // Service methods for search, filters, and saved searches will be implemented in Phases 3-5
}
