import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoringConfigsService } from '../scoring-configs/scoring-configs.service';
import { ScoreCalculationService } from '../player-research/services/score-calculation.service';
import { SearchPlayersDto } from '../player-research/dto/search-players.dto';

describe('PlayersService', () => {
  let service: PlayersService;
  let prismaService: PrismaService;
  let scoringConfigsService: ScoringConfigsService;
  let scoreCalculationService: ScoreCalculationService;

  const mockPrismaService = {
    player: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
  };

  const mockScoringConfigsService = {
    findOne: jest.fn(),
  };

  const mockScoreCalculationService = {
    calculatePlayerScores: jest.fn(),
  };

  // Helper function to create fresh player object (prevents mutation between tests)
  const createMockPlayer = () => ({
    id: 'player-1',
    name: 'Mike Trout',
    position: 'OF',
    status: 'active',
    season: 2024,
    mlbId: 'mlb-123',
    teamId: 'team-1',
    team: {
      id: 'team-1',
      name: 'Los Angeles Angels',
      abbreviation: 'LAA',
      league: 'AL',
    },
    statistics: [
      {
        id: 'stat-1',
        playerId: 'player-1',
        season: 2024,
        statisticType: 'hitting',
        gamesPlayed: 150,
        atBats: 550,
        hits: 180,
        homeRuns: 40,
        rbi: 120,
        stolenBases: 20,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPlayer = createMockPlayer();

  // Helper function to create fresh pitcher object
  const createMockPitcher = () => ({
    id: 'player-2',
    name: 'Shohei Ohtani',
    position: 'P',
    status: 'active',
    season: 2024,
    mlbId: 'mlb-124',
    teamId: 'team-1',
    team: {
      id: 'team-1',
      name: 'Los Angeles Angels',
      abbreviation: 'LAA',
      league: 'AL',
    },
    statistics: [
      {
        id: 'stat-2',
        playerId: 'player-2',
        season: 2024,
        statisticType: 'pitching',
        gamesPlayed: 30,
        wins: 15,
        losses: 8,
        era: 2.50,
        strikeouts: 250,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPitcher = createMockPitcher();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ScoringConfigsService, useValue: mockScoringConfigsService },
        {
          provide: ScoreCalculationService,
          useValue: mockScoreCalculationService,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    prismaService = module.get<PrismaService>(PrismaService);
    scoringConfigsService =
      module.get<ScoringConfigsService>(ScoringConfigsService);
    scoreCalculationService = module.get<ScoreCalculationService>(
      ScoreCalculationService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    describe('filtering', () => {
      it('should filter by hitting statistic type (exclude pitchers)', async () => {
        const filters: SearchPlayersDto = {
          statisticType: 'hitting',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(result.players).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              position: { notIn: ['P'] },
            }),
          }),
        );
      });

      it('should filter by pitching statistic type (only pitchers)', async () => {
        const filters: SearchPlayersDto = {
          statisticType: 'pitching',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPitcher()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(result.players).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              position: { in: ['P'] },
            }),
          }),
        );
      });

      it('should filter by specific positions', async () => {
        const filters: SearchPlayersDto = {
          position: ['OF', '1B'],
          statisticType: 'hitting',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              position: { in: ['OF', '1B'] },
            }),
          }),
        );
      });

      it('should filter by league (AL)', async () => {
        const filters: SearchPlayersDto = {
          league: 'AL',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              team: { league: 'AL' },
            }),
          }),
        );
      });

      it('should not filter by league when set to "both"', async () => {
        const filters: SearchPlayersDto = {
          league: 'both',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([
          createMockPlayer(),
          createMockPitcher(),
        ]);
        mockPrismaService.player.count.mockResolvedValue(2);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.not.objectContaining({
              team: expect.anything(),
            }),
          }),
        );
      });

      it('should filter by status', async () => {
        const filters: SearchPlayersDto = {
          status: 'active',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'active',
            }),
          }),
        );
      });

      it('should filter by season', async () => {
        const filters: SearchPlayersDto = {
          season: 2024,
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              season: 2024,
            }),
          }),
        );
      });

      it('should filter by date range', async () => {
        const filters: SearchPlayersDto = {
          dateFrom: '2024-04-01',
          dateTo: '2024-06-01',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              statistics: {
                some: {
                  dateFrom: { gte: new Date('2024-04-01') },
                  dateTo: { lte: new Date('2024-06-01') },
                },
              },
            }),
          }),
        );
      });

      it('should combine multiple filters', async () => {
        const filters: SearchPlayersDto = {
          position: ['OF'],
          league: 'AL',
          status: 'active',
          season: 2024,
          statisticType: 'hitting',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              position: { in: ['OF'] },
              team: { league: 'AL' },
              status: 'active',
              season: 2024,
            }),
          }),
        );
      });
    });

    describe('sorting', () => {
      it('should sort by name ascending', async () => {
        const filters: SearchPlayersDto = {
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ name: 'asc' }],
          }),
        );
      });

      it('should sort by position descending', async () => {
        const filters: SearchPlayersDto = {
          sortBy: 'position',
          sortOrder: 'desc',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ position: 'desc' }],
          }),
        );
      });

      it('should sort by team name', async () => {
        const filters: SearchPlayersDto = {
          sortBy: 'team',
          sortOrder: 'asc',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ team: { name: 'asc' } }],
          }),
        );
      });

      it('should use default sort (status asc, name asc) when no sortBy specified', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ status: 'asc' }, { name: 'asc' }],
          }),
        );
      });

      it('should sort by score in-memory and paginate after', async () => {
        const filters: SearchPlayersDto = {
          sortBy: 'score',
          sortOrder: 'desc',
          scoringConfigId: 'config-1',
          page: 1,
          limit: 2,
        };

        const players = [
          { ...createMockPlayer(), id: 'player-1' },
          { ...createMockPlayer(), id: 'player-2' },
          { ...createMockPlayer(), id: 'player-3' },
        ];

        mockPrismaService.player.findMany.mockResolvedValue(players);
        mockPrismaService.player.count.mockResolvedValue(3);

        mockScoringConfigsService.findOne.mockResolvedValue({
          id: 'config-1',
          name: 'Test Config',
        });

        // Mock score calculation
        const scoresMap = new Map([
          ['player-1', 100],
          ['player-2', 200],
          ['player-3', 150],
        ]);
        mockScoreCalculationService.calculatePlayerScores.mockReturnValue(
          scoresMap,
        );

        const result = await service.findAll(filters, 'user-1');

        // Should fetch all records (no pagination at DB level)
        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 0,
            take: undefined,
          }),
        );

        // Should return only page 1 (2 items)
        expect(result.players).toHaveLength(2);
        // Scores should be sorted descending
        expect((result.players[0] as any).score).toBe(200);
        expect((result.players[1] as any).score).toBe(150);
      });

      it('should handle null scores when sorting by score', async () => {
        const filters: SearchPlayersDto = {
          sortBy: 'score',
          sortOrder: 'desc',
          scoringConfigId: 'config-1',
          page: 1,
          limit: 50,
        };

        const players = [
          { ...createMockPlayer(), id: 'player-1' },
          { ...createMockPlayer(), id: 'player-2' },
        ];

        mockPrismaService.player.findMany.mockResolvedValue(players);
        mockPrismaService.player.count.mockResolvedValue(2);

        mockScoringConfigsService.findOne.mockResolvedValue({
          id: 'config-1',
          name: 'Test Config',
        });

        // One player has score, one doesn't
        const scoresMap = new Map([['player-1', 100]]);
        mockScoreCalculationService.calculatePlayerScores.mockReturnValue(
          scoresMap,
        );

        const result = await service.findAll(filters, 'user-1');

        expect(result.players).toHaveLength(2);
        // Player with score should come first
        expect((result.players[0] as any).score).toBe(100);
        expect((result.players[1] as any).score).toBeUndefined();
      });
    });

    describe('pagination', () => {
      it('should paginate results correctly (page 1)', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 10,
        };

        mockPrismaService.player.findMany.mockResolvedValue([mockPlayer]);
        mockPrismaService.player.count.mockResolvedValue(25);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 0,
            take: 10,
          }),
        );
      });

      it('should paginate results correctly (page 2)', async () => {
        const filters: SearchPlayersDto = {
          page: 2,
          limit: 10,
        };

        mockPrismaService.player.findMany.mockResolvedValue([mockPlayer]);
        mockPrismaService.player.count.mockResolvedValue(25);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 10,
            take: 10,
          }),
        );
      });

      it('should use default limit of 50 when not specified', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
        };

        mockPrismaService.player.findMany.mockResolvedValue([mockPlayer]);
        mockPrismaService.player.count.mockResolvedValue(100);

        await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 50,
          }),
        );
      });

      it('should return total count', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 10,
        };

        mockPrismaService.player.findMany.mockResolvedValue([mockPlayer]);
        mockPrismaService.player.count.mockResolvedValue(100);

        const result = await service.findAll(filters);

        expect(result.total).toBe(100);
      });
    });

    describe('score calculation', () => {
      it('should calculate scores when scoringConfigId and userId provided', async () => {
        const filters: SearchPlayersDto = {
          scoringConfigId: 'config-1',
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        mockScoringConfigsService.findOne.mockResolvedValue({
          id: 'config-1',
          name: 'Test Config',
        });

        const scoresMap = new Map([['player-1', 85.5]]);
        mockScoreCalculationService.calculatePlayerScores.mockReturnValue(
          scoresMap,
        );

        const result = await service.findAll(filters, 'user-1');

        expect(mockScoringConfigsService.findOne).toHaveBeenCalledWith(
          'user-1',
          'config-1',
        );
        expect(mockScoreCalculationService.calculatePlayerScores).toHaveBeenCalled();
        expect((result.players[0] as any).score).toBe(85.5);
      });

      it('should not calculate scores when scoringConfigId not provided', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 50,
        };

        // Create fresh player object without score
        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(mockScoringConfigsService.findOne).not.toHaveBeenCalled();
        expect(mockScoreCalculationService.calculatePlayerScores).not.toHaveBeenCalled();
        expect((result.players[0] as any).score).toBeUndefined();
      });

      it('should not calculate scores when userId not provided', async () => {
        const filters: SearchPlayersDto = {
          scoringConfigId: 'config-1',
          page: 1,
          limit: 50,
        };

        // Create fresh player object without score
        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(mockScoringConfigsService.findOne).not.toHaveBeenCalled();
        expect(mockScoreCalculationService.calculatePlayerScores).not.toHaveBeenCalled();
        expect((result.players[0] as any).score).toBeUndefined();
      });

      it('should handle score calculation errors gracefully', async () => {
        const filters: SearchPlayersDto = {
          scoringConfigId: 'config-1',
          page: 1,
          limit: 50,
        };

        // Create fresh player object without score
        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        mockScoringConfigsService.findOne.mockRejectedValue(
          new Error('Config not found'),
        );

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await service.findAll(filters, 'user-1');

        expect(result.players).toHaveLength(1);
        expect((result.players[0] as any).score).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to calculate scores:',
          expect.any(Error),
        );

        consoleSpy.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('should return empty array when no players match filters', async () => {
        const filters: SearchPlayersDto = {
          position: ['QB'], // Invalid baseball position
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([]);
        mockPrismaService.player.count.mockResolvedValue(0);

        const result = await service.findAll(filters);

        expect(result.players).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      it('should include team information in results', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              team: true,
            }),
          }),
        );
        expect(result.players[0].team).toBeDefined();
      });

      it('should include statistics in results', async () => {
        const filters: SearchPlayersDto = {
          page: 1,
          limit: 50,
        };

        mockPrismaService.player.findMany.mockResolvedValue([createMockPlayer()]);
        mockPrismaService.player.count.mockResolvedValue(1);

        const result = await service.findAll(filters);

        expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              statistics: expect.any(Object),
            }),
          }),
        );
        expect(result.players[0].statistics).toBeDefined();
      });
    });
  });

  describe('findOne', () => {
    it('should find a player by ID', async () => {
      const player = createMockPlayer();
      mockPrismaService.player.findUnique.mockResolvedValue(player);

      const result = await service.findOne('player-1');

      expect(result).toEqual(player);
      expect(mockPrismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        include: {
          team: true,
          statistics: {
            orderBy: { season: 'desc' },
          },
        },
      });
    });

    it('should return null when player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getUniqueTeams', () => {
    it('should return sorted list of team names', async () => {
      const mockTeams = [
        { id: 'team-1', name: 'Angels', abbreviation: 'LAA', league: 'AL' },
        { id: 'team-2', name: 'Dodgers', abbreviation: 'LAD', league: 'NL' },
        { id: 'team-3', name: 'Yankees', abbreviation: 'NYY', league: 'AL' },
      ];

      mockPrismaService.team.findMany.mockResolvedValue(mockTeams);

      const result = await service.getUniqueTeams();

      expect(result).toEqual(['Angels', 'Dodgers', 'Yankees']);
      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no teams exist', async () => {
      mockPrismaService.team.findMany.mockResolvedValue([]);

      const result = await service.getUniqueTeams();

      expect(result).toEqual([]);
    });
  });

  describe('getUniquePositions', () => {
    it('should return sorted list of unique positions', async () => {
      const mockPositions = [
        { position: '1B' },
        { position: 'OF' },
        { position: 'P' },
      ];

      mockPrismaService.player.findMany.mockResolvedValue(mockPositions);

      const result = await service.getUniquePositions();

      expect(result).toEqual(['1B', 'OF', 'P']);
      expect(mockPrismaService.player.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        select: { position: true },
        distinct: ['position'],
        orderBy: { position: 'asc' },
      });
    });

    it('should only return positions from active players', async () => {
      mockPrismaService.player.findMany.mockResolvedValue([{ position: 'OF' }]);

      await service.getUniquePositions();

      expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        }),
      );
    });

    it('should return empty array when no active players exist', async () => {
      mockPrismaService.player.findMany.mockResolvedValue([]);

      const result = await service.getUniquePositions();

      expect(result).toEqual([]);
    });
  });
});
