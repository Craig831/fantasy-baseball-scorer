import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LineupsService } from './lineups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';

describe('LineupsService', () => {
  let service: LineupsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    lineup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lineupSlot: {
      upsert: jest.fn(),
      createMany: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
    },
    scoringConfiguration: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockLineupId = 'lineup-456';
  const mockPlayerId1 = 'player-1';
  const mockPlayerId2 = 'player-2';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineupsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LineupsService>(LineupsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new lineup with scoringConfigId as null', async () => {
      const dto: CreateLineupDto = {
        name: 'My Dream Team',
        gameDate: '2025-04-15',
      };

      const createdLineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: dto.name,
        gameDate: new Date(dto.gameDate),
        scoringConfigId: null,
        projectedScore: 0,
        actualScore: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        slots: [],
      };

      mockPrismaService.lineup.create.mockResolvedValue(createdLineup);

      const result = await service.create(mockUserId, dto);

      expect(result.scoringConfigId).toBeNull();
      expect(result.name).toBe(dto.name);
      expect(mockPrismaService.lineup.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          name: dto.name,
          gameDate: new Date(dto.gameDate),
          scoringConfigId: null,
          projectedScore: 0,
          actualScore: null,
        },
        include: expect.any(Object),
      });
    });

    it('should create a lineup without gameDate if not provided', async () => {
      const dto: CreateLineupDto = {
        name: 'My Dream Team',
      };

      const createdLineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: dto.name,
        gameDate: null,
        scoringConfigId: null,
        projectedScore: 0,
        slots: [],
      };

      mockPrismaService.lineup.create.mockResolvedValue(createdLineup);

      const result = await service.create(mockUserId, dto);

      expect(result.gameDate).toBeNull();
      expect(mockPrismaService.lineup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gameDate: null,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted lineups for a user', async () => {
      const lineups = [
        {
          id: 'lineup-1',
          userId: mockUserId,
          name: 'Lineup 1',
          deletedAt: null,
          slots: [],
        },
        {
          id: 'lineup-2',
          userId: mockUserId,
          name: 'Lineup 2',
          deletedAt: null,
          slots: [],
        },
      ];

      mockPrismaService.lineup.findMany.mockResolvedValue(lineups);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.lineup.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should not return soft-deleted lineups', async () => {
      mockPrismaService.lineup.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId);

      expect(mockPrismaService.lineup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a lineup if user owns it', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: 'My Lineup',
        deletedAt: null,
        slots: [],
      };

      mockPrismaService.lineup.findUnique
        .mockResolvedValueOnce(lineup) // First call in checkOwnership
        .mockResolvedValueOnce(lineup); // Second call in findOne

      const result = await service.findOne(mockLineupId, mockUserId);

      expect(result).toEqual(lineup);
    });

    it('should throw NotFoundException if lineup does not exist', async () => {
      mockPrismaService.lineup.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockLineupId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own lineup', async () => {
      const lineup = {
        id: mockLineupId,
        userId: 'different-user',
        name: 'Someone else lineup',
        deletedAt: null,
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);

      await expect(service.findOne(mockLineupId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if lineup is soft-deleted', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: new Date(),
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);

      await expect(service.findOne(mockLineupId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update lineup name', async () => {
      const dto: UpdateLineupDto = {
        name: 'Updated Name',
      };

      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: null,
      };

      const updatedLineup = {
        ...lineup,
        name: dto.name,
        slots: [],
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          lineup: {
            update: jest.fn().mockResolvedValue(updatedLineup),
            findUnique: jest.fn().mockResolvedValue(updatedLineup),
          },
          lineupSlot: {
            upsert: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await service.update(mockLineupId, mockUserId, dto);

      expect(result.name).toBe(dto.name);
    });

    it('should update lineup slots', async () => {
      const dto: UpdateLineupDto = {
        slots: [
          { slotOrder: 1, playerId: mockPlayerId1 },
          { slotOrder: 2, playerId: mockPlayerId2 },
        ],
      };

      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: null,
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);
      mockPrismaService.player.findMany.mockResolvedValue([
        { id: mockPlayerId1 },
        { id: mockPlayerId2 },
      ]);

      const updatedLineup = {
        ...lineup,
        slots: dto.slots,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          lineup: {
            update: jest.fn(),
            findUnique: jest.fn().mockResolvedValue(updatedLineup),
          },
          lineupSlot: {
            upsert: jest.fn(),
          },
        });
      });

      const result = await service.update(mockLineupId, mockUserId, dto);

      expect(result.slots).toHaveLength(2);
    });

    it('should validate slots before updating', async () => {
      const dto: UpdateLineupDto = {
        slots: [
          { slotOrder: 1, playerId: mockPlayerId1 },
          { slotOrder: 2, playerId: mockPlayerId1 }, // Duplicate
        ],
      };

      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: null,
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);

      await expect(
        service.update(mockLineupId, mockUserId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a lineup', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: null,
      };

      const deletedLineup = {
        ...lineup,
        deletedAt: new Date(),
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);
      mockPrismaService.lineup.update.mockResolvedValue(deletedLineup);

      const result = await service.remove(mockLineupId, mockUserId);

      expect(result.deletedAt).toBeDefined();
      expect(mockPrismaService.lineup.update).toHaveBeenCalledWith({
        where: { id: mockLineupId },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('validateLineup', () => {
    it('should validate a correct lineup', async () => {
      const slots = [
        { slotOrder: 1, playerId: mockPlayerId1 },
        { slotOrder: 2, playerId: mockPlayerId2 },
      ];

      mockPrismaService.player.findMany.mockResolvedValue([
        { id: mockPlayerId1 },
        { id: mockPlayerId2 },
      ]);

      await expect(service.validateLineup(slots)).resolves.toBe(true);
    });

    it('should throw error if more than 25 slots', async () => {
      const slots = Array.from({ length: 26 }, (_, i) => ({
        slotOrder: i + 1,
        playerId: `player-${i}`,
      }));

      await expect(service.validateLineup(slots)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateLineup(slots)).rejects.toThrow(
        'Lineup cannot have more than 25 slots',
      );
    });

    it('should throw error if duplicate players', async () => {
      const slots = [
        { slotOrder: 1, playerId: mockPlayerId1 },
        { slotOrder: 2, playerId: mockPlayerId1 }, // Duplicate
      ];

      await expect(service.validateLineup(slots)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateLineup(slots)).rejects.toThrow(
        'Lineup cannot contain duplicate players',
      );
    });

    it('should throw error if player does not exist', async () => {
      const slots = [
        { slotOrder: 1, playerId: mockPlayerId1 },
        { slotOrder: 2, playerId: 'invalid-player' },
      ];

      mockPrismaService.player.findMany.mockResolvedValue([
        { id: mockPlayerId1 },
      ]);

      await expect(service.validateLineup(slots)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateLineup(slots)).rejects.toThrow(
        'Invalid player IDs',
      );
    });

    it('should allow empty slots (null playerIds)', async () => {
      const slots = [
        { slotOrder: 1, playerId: mockPlayerId1 },
        { slotOrder: 2, playerId: null },
        { slotOrder: 3, playerId: null },
      ];

      mockPrismaService.player.findMany.mockResolvedValue([
        { id: mockPlayerId1 },
      ]);

      await expect(service.validateLineup(slots)).resolves.toBe(true);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a lineup with new name', async () => {
      const sourceLineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: 'Original Lineup',
        gameDate: new Date('2025-04-15'),
        deletedAt: null,
        slots: [
          {
            slotOrder: 1,
            playerId: mockPlayerId1,
            projectedScore: 0,
            locked: false,
          },
        ],
      };

      const newLineup = {
        id: 'new-lineup-id',
        userId: mockUserId,
        name: 'Duplicated Lineup',
        gameDate: sourceLineup.gameDate,
        scoringConfigId: null,
        slots: [],
      };

      mockPrismaService.lineup.findUnique
        .mockResolvedValueOnce(sourceLineup) // checkOwnership
        .mockResolvedValueOnce(sourceLineup); // findOne

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          lineup: {
            create: jest.fn().mockResolvedValue(newLineup),
            findUnique: jest.fn().mockResolvedValue({
              ...newLineup,
              slots: sourceLineup.slots,
            }),
          },
          lineupSlot: {
            createMany: jest.fn(),
          },
        });
      });

      const result = await service.duplicate(
        mockLineupId,
        mockUserId,
        'Duplicated Lineup',
      );

      expect(result.name).toBe('Duplicated Lineup');
      expect(result.scoringConfigId).toBeNull();
    });
  });

  describe('calculateScore', () => {
    it('should return raw stats message if no active scoring config', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: 'My Lineup',
        deletedAt: null,
        slots: [],
      };

      mockPrismaService.lineup.findUnique
        .mockResolvedValueOnce(lineup) // checkOwnership
        .mockResolvedValueOnce(lineup); // findOne
      mockPrismaService.scoringConfiguration.findFirst.mockResolvedValue(null);

      const result = await service.calculateScore(mockLineupId, mockUserId);

      expect(result.rawStats).toBe(true);
      expect(result.totalScore).toBeNull();
      expect(result.message).toContain('No active scoring configuration');
    });

    it('should calculate score with active scoring config', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: 'My Lineup',
        deletedAt: null,
        slots: [
          {
            player: {
              id: mockPlayerId1,
              name: 'Mike Trout',
              statistics: [
                {
                  statistics: {
                    hits: 10,
                    homeRuns: 5,
                  },
                },
              ],
            },
          },
        ],
      };

      const activeConfig = {
        id: 'config-1',
        name: 'Default Config',
        categories: {
          hits: { weight: 1 },
          homeRuns: { weight: 4 },
        },
      };

      mockPrismaService.lineup.findUnique
        .mockResolvedValueOnce(lineup) // checkOwnership
        .mockResolvedValueOnce(lineup); // findOne
      mockPrismaService.scoringConfiguration.findFirst.mockResolvedValue(
        activeConfig,
      );

      const result = await service.calculateScore(mockLineupId, mockUserId);

      expect(result.rawStats).toBe(false);
      expect(result.totalScore).toBe(30); // (10 * 1) + (5 * 4) = 30
      expect(result.scoringConfig.id).toBe(activeConfig.id);
    });

    it('should handle empty slots in score calculation', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        name: 'My Lineup',
        deletedAt: null,
        slots: [
          {
            player: null, // Empty slot
          },
        ],
      };

      const activeConfig = {
        id: 'config-1',
        name: 'Default Config',
        categories: {
          hits: { weight: 1 },
        },
      };

      mockPrismaService.lineup.findUnique
        .mockResolvedValueOnce(lineup) // checkOwnership
        .mockResolvedValueOnce(lineup); // findOne
      mockPrismaService.scoringConfiguration.findFirst.mockResolvedValue(
        activeConfig,
      );

      const result = await service.calculateScore(mockLineupId, mockUserId);

      expect(result.totalScore).toBe(0);
    });
  });

  describe('checkOwnership', () => {
    it('should pass if user owns the lineup', async () => {
      const lineup = {
        id: mockLineupId,
        userId: mockUserId,
        deletedAt: null,
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);

      await expect(
        service['checkOwnership'](mockLineupId, mockUserId),
      ).resolves.toEqual(lineup);
    });

    it('should throw NotFoundException if lineup not found', async () => {
      mockPrismaService.lineup.findUnique.mockResolvedValue(null);

      await expect(
        service['checkOwnership'](mockLineupId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own lineup', async () => {
      const lineup = {
        id: mockLineupId,
        userId: 'different-user',
        deletedAt: null,
      };

      mockPrismaService.lineup.findUnique.mockResolvedValue(lineup);

      await expect(
        service['checkOwnership'](mockLineupId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
