/**
 * Lineups Service
 * Business logic for lineup management
 *
 * Key Design Principles:
 * - Lineups are NOT tied to scoring configurations
 * - Scores calculated dynamically using user's current active config
 * - If no active config, display raw player stats
 * - Max 25 players per lineup
 * - No duplicate players allowed
 * - Soft delete pattern (deletedAt)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';

@Injectable()
export class LineupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new lineup for a user
   * @param userId - Owner of the lineup
   * @param dto - Lineup creation data
   */
  async create(userId: string, dto: CreateLineupDto) {
    return await this.prisma.lineup.create({
      data: {
        userId,
        name: dto.name,
        gameDate: dto.gameDate ? new Date(dto.gameDate) : null,
        scoringConfigId: null, // NEVER set - scores calculated dynamically
        projectedScore: 0,
        actualScore: null,
      },
      include: {
        slots: {
          include: {
            player: true,
          },
          orderBy: {
            slotOrder: 'asc',
          },
        },
      },
    });
  }

  /**
   * List all lineups for a user (non-deleted only)
   * @param userId - Owner of the lineups
   */
  async findAll(userId: string) {
    return await this.prisma.lineup.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        slots: {
          include: {
            player: true,
          },
          orderBy: {
            slotOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single lineup by ID
   * Includes all slots and player data
   * @param lineupId - Lineup ID
   * @param userId - User making the request (for ownership check)
   */
  async findOne(lineupId: string, userId: string) {
    await this.checkOwnership(lineupId, userId);

    const lineup = await this.prisma.lineup.findUnique({
      where: { id: lineupId },
      include: {
        slots: {
          include: {
            player: {
              include: {
                team: true,
                statistics: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            slotOrder: 'asc',
          },
        },
      },
    });

    if (!lineup) {
      throw new NotFoundException(`Lineup with ID ${lineupId} not found`);
    }

    return lineup;
  }

  /**
   * Update lineup name and/or slots
   * @param lineupId - Lineup ID
   * @param userId - User making the request (for ownership check)
   * @param dto - Update data
   */
  async update(lineupId: string, userId: string, dto: UpdateLineupDto) {
    await this.checkOwnership(lineupId, userId);

    // If updating slots, validate the lineup
    if (dto.slots && dto.slots.length > 0) {
      await this.validateLineup(dto.slots);
    }

    // Use transaction to update both lineup and slots atomically
    return await this.prisma.$transaction(async (tx) => {
      // Update lineup name if provided
      const updateData: any = {};
      if (dto.name) {
        updateData.name = dto.name;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.lineup.update({
          where: { id: lineupId },
          data: updateData,
        });
      }

      // Update slots if provided
      if (dto.slots && dto.slots.length > 0) {
        for (const slot of dto.slots) {
          await tx.lineupSlot.upsert({
            where: {
              unique_lineup_slot_order: {
                lineupId,
                slotOrder: slot.slotOrder,
              },
            },
            create: {
              lineupId,
              slotOrder: slot.slotOrder,
              playerId: slot.playerId,
              projectedScore: 0,
              actualScore: null,
              locked: false,
            },
            update: {
              playerId: slot.playerId,
            },
          });
        }
      }

      // Return updated lineup with slots
      return await tx.lineup.findUnique({
        where: { id: lineupId },
        include: {
          slots: {
            include: {
              player: true,
            },
            orderBy: {
              slotOrder: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Soft delete a lineup
   * @param lineupId - Lineup ID
   * @param userId - User making the request (for ownership check)
   */
  async remove(lineupId: string, userId: string) {
    await this.checkOwnership(lineupId, userId);

    return await this.prisma.lineup.update({
      where: { id: lineupId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Calculate lineup score using current active scoring config
   * Falls back to raw stats if no active config
   * @param lineupId - Lineup ID
   * @param userId - User ID (for active config lookup)
   */
  async calculateScore(lineupId: string, userId: string) {
    // Get lineup with slots and player stats
    const lineup = await this.findOne(lineupId, userId);

    // Get user's active scoring configuration
    const activeConfig = await this.prisma.scoringConfiguration.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    // If no active config, return raw stats without score calculation
    if (!activeConfig) {
      return {
        lineup,
        totalScore: null,
        message: 'No active scoring configuration - showing raw player stats',
        rawStats: true,
      };
    }

    // Calculate scores for each slot using the active config
    let totalProjectedScore = 0;
    const slotsWithScores: any[] = [];

    for (const slot of lineup.slots) {
      if (!slot.player) {
        slotsWithScores.push({
          ...slot,
          calculatedScore: 0,
          breakdown: {},
        });
        continue;
      }

      // Get most recent statistics for this player
      const stats = slot.player.statistics?.[0];
      if (!stats || !stats.statistics) {
        slotsWithScores.push({
          ...slot,
          calculatedScore: 0,
          breakdown: {},
        });
        continue;
      }

      // Calculate score based on scoring categories
      const categories = activeConfig.categories as any;
      let playerScore = 0;
      const breakdown: Record<string, number> = {};

      // Iterate through each scoring category
      for (const [categoryName, categoryConfig] of Object.entries(categories)) {
        const config = categoryConfig as any;
        const statValue = (stats.statistics as any)[categoryName];

        if (statValue !== undefined && config.weight) {
          const points = statValue * config.weight;
          playerScore += points;
          breakdown[categoryName] = points;
        }
      }

      totalProjectedScore += playerScore;

      slotsWithScores.push({
        ...slot,
        calculatedScore: playerScore,
        breakdown,
      });
    }

    return {
      lineup: {
        ...lineup,
        slots: slotsWithScores,
      },
      totalScore: totalProjectedScore,
      scoringConfig: {
        id: activeConfig.id,
        name: activeConfig.name,
      },
      rawStats: false,
    };
  }

  /**
   * Validate lineup constraints
   * - Max 25 players
   * - No duplicate players
   * - All players exist
   * @param slots - Array of slot updates
   */
  async validateLineup(slots: Array<{ slotOrder: number; playerId: string | null }>) {
    // Check max 25 slots
    if (slots.length > 25) {
      throw new BadRequestException('Lineup cannot have more than 25 slots');
    }

    // Filter out null playerIds (empty slots are allowed)
    const playerIds = slots
      .map((slot) => slot.playerId)
      .filter((id): id is string => id !== null);

    // Check for duplicate players
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      throw new BadRequestException('Lineup cannot contain duplicate players');
    }

    // Validate all players exist (only if there are players)
    if (playerIds.length > 0) {
      const players = await this.prisma.player.findMany({
        where: {
          id: { in: playerIds },
        },
        select: {
          id: true,
        },
      });

      if (players.length !== playerIds.length) {
        const foundIds = new Set(players.map((p) => p.id));
        const missingIds = playerIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `Invalid player IDs: ${missingIds.join(', ')}`,
        );
      }
    }

    return true;
  }

  /**
   * Duplicate an existing lineup
   * @param lineupId - Source lineup ID
   * @param userId - User making the request (for ownership check)
   * @param newName - Name for the duplicated lineup
   */
  async duplicate(lineupId: string, userId: string, newName: string) {
    // Check ownership and get source lineup
    const sourceLineup = await this.findOne(lineupId, userId);

    // Create new lineup with same data
    return await this.prisma.$transaction(async (tx) => {
      // Create new lineup
      const newLineup = await tx.lineup.create({
        data: {
          userId,
          name: newName,
          gameDate: sourceLineup.gameDate,
          scoringConfigId: null, // Always NULL per architecture
          projectedScore: 0,
          actualScore: null,
        },
      });

      // Duplicate all slots
      if (sourceLineup.slots && sourceLineup.slots.length > 0) {
        const slotData = sourceLineup.slots.map((slot) => ({
          lineupId: newLineup.id,
          slotOrder: slot.slotOrder,
          playerId: slot.playerId,
          projectedScore: 0,
          actualScore: null,
          locked: false,
        }));

        await tx.lineupSlot.createMany({
          data: slotData,
        });
      }

      // Return new lineup with slots
      return await tx.lineup.findUnique({
        where: { id: newLineup.id },
        include: {
          slots: {
            include: {
              player: true,
            },
            orderBy: {
              slotOrder: 'asc',
            },
          },
        },
      });
    });
  }

  /**
   * Helper: Check if user owns a lineup
   * @param lineupId - Lineup ID
   * @param userId - User ID
   * @throws NotFoundException if lineup doesn't exist
   * @throws ForbiddenException if user doesn't own lineup
   */
  private async checkOwnership(lineupId: string, userId: string) {
    const lineup = await this.prisma.lineup.findUnique({
      where: { id: lineupId },
    });

    if (!lineup || lineup.deletedAt) {
      throw new NotFoundException(`Lineup with ID ${lineupId} not found`);
    }

    if (lineup.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this lineup');
    }

    return lineup;
  }
}
