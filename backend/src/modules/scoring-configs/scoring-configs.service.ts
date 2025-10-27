import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScoringConfigDto } from './dto/create-scoring-config.dto';
import { UpdateScoringConfigDto } from './dto/update-scoring-config.dto';

@Injectable()
export class ScoringConfigsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateScoringConfigDto) {
    // If isActive is true, deactivate all other configs for this user
    if (createDto.isActive) {
      await this.prisma.scoringConfiguration.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    const config = await this.prisma.scoringConfiguration.create({
      data: {
        userId,
        name: createDto.name,
        categories: createDto.categories,
        isActive: createDto.isActive || false,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        categories: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.formatResponse(config);
  }

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [configs, total] = await Promise.all([
      this.prisma.scoringConfiguration.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' }, // Active configs first
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          userId: true,
          name: true,
          categories: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.scoringConfiguration.count({
        where: { userId },
      }),
    ]);

    return {
      data: configs.map((config) => this.formatResponse(config)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const config = await this.prisma.scoringConfiguration.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        categories: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      throw new NotFoundException('Scoring configuration not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('You do not have access to this configuration');
    }

    return this.formatResponse(config);
  }

  async update(userId: string, id: string, updateDto: UpdateScoringConfigDto) {
    // Check ownership
    await this.findOne(userId, id);

    const config = await this.prisma.scoringConfiguration.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.categories && { categories: updateDto.categories }),
      },
      select: {
        id: true,
        userId: true,
        name: true,
        categories: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.formatResponse(config);
  }

  async activate(userId: string, id: string) {
    // Check ownership
    await this.findOne(userId, id);

    // Deactivate all other configs for this user
    await this.prisma.scoringConfiguration.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Activate this config
    const config = await this.prisma.scoringConfiguration.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        userId: true,
        name: true,
        categories: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.formatResponse(config);
  }

  async remove(userId: string, id: string) {
    // Check ownership
    await this.findOne(userId, id);

    await this.prisma.scoringConfiguration.delete({
      where: { id },
    });

    return { success: true };
  }

  private formatResponse(config: any) {
    return {
      id: config.id,
      userId: config.userId,
      name: config.name,
      categories: config.categories,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
