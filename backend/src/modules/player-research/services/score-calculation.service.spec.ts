import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCalculationService } from './score-calculation.service';

describe('ScoreCalculationService', () => {
  let service: ScoreCalculationService;

  const mockBattingConfig = {
    id: 'config-1',
    categories: {
      batting: {
        hits: 1,
        homeRuns: 4,
        rbi: 1,
        stolenBases: 2,
        runs: 1,
      },
      pitching: {},
    },
  };

  const mockPitchingConfig = {
    id: 'config-2',
    categories: {
      batting: {},
      pitching: {
        wins: 5,
        strikeouts: 1,
        saves: 5,
        era: -2, // Negative weight (lower is better)
        whip: -3, // Negative weight (lower is better)
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoreCalculationService],
    }).compile();

    service = module.get<ScoreCalculationService>(ScoreCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePlayerScore', () => {
    describe('batting statistics', () => {
      it('should calculate score for a batter with statistics', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 150,
                homeRuns: 30,
                rbi: 100,
                stolenBases: 20,
                runs: 90,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.playerId).toBe('player-1');
        expect(result!.statisticType).toBe('batting');
        expect(result!.categoryScores).toHaveLength(5);

        // Calculate expected total: 150*1 + 30*4 + 100*1 + 20*2 + 90*1
        // = 150 + 120 + 100 + 40 + 90 = 500
        expect(result!.totalScore).toBe(500);
      });

      it('should include category breakdown details', () => {
        const player = {
          id: 'player-1',
          position: '1B',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 150,
                homeRuns: 30,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result!.categoryScores).toContainEqual({
          categoryName: 'hits',
          statValue: 150,
          weight: 1,
          points: 150,
        });

        expect(result!.categoryScores).toContainEqual({
          categoryName: 'homeRuns',
          statValue: 30,
          weight: 4,
          points: 120,
        });
      });

      it('should handle missing stat values gracefully', () => {
        const player = {
          id: 'player-1',
          position: 'SS',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 100,
                // homeRuns, rbi, stolenBases, runs are missing
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores).toHaveLength(1);
        expect(result!.totalScore).toBe(100); // Only hits counted
      });

      it('should handle zero stat values', () => {
        const player = {
          id: 'player-1',
          position: 'C',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 0,
                homeRuns: 0,
                rbi: 50,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores).toHaveLength(3);
        expect(result!.totalScore).toBe(50); // Only rbi counted
      });
    });

    describe('pitching statistics', () => {
      it('should calculate score for a pitcher with statistics', () => {
        const player = {
          id: 'player-2',
          position: 'P',
          statistics: [
            {
              statisticType: 'pitching',
              statistics: {
                wins: 15,
                strikeouts: 200,
                saves: 0,
                era: 3.5,
                whip: 1.2,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockPitchingConfig);

        expect(result).not.toBeNull();
        expect(result!.playerId).toBe('player-2');
        expect(result!.statisticType).toBe('pitching');
        expect(result!.categoryScores).toHaveLength(5);

        // Calculate expected total: 15*5 + 200*1 + 0*5 + 3.5*(-2) + 1.2*(-3)
        // = 75 + 200 + 0 - 7 - 3.6 = 264.4
        expect(result!.totalScore).toBeCloseTo(264.4, 1);
      });

      it('should recognize pitcher position variations', () => {
        const positions = ['P', 'pitcher', 'Pitcher', 'PITCHER'];

        for (const position of positions) {
          const player = {
            id: 'player-2',
            position,
            statistics: [
              {
                statisticType: 'pitching',
                statistics: { wins: 10 },
              },
            ],
          };

          const result = service.calculatePlayerScore(
            player,
            mockPitchingConfig,
          );

          expect(result).not.toBeNull();
          expect(result!.statisticType).toBe('pitching');
        }
      });

      it('should handle negative weights (ERA, WHIP)', () => {
        const player = {
          id: 'player-2',
          position: 'P',
          statistics: [
            {
              statisticType: 'pitching',
              statistics: {
                era: 2.5,
                whip: 1.0,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockPitchingConfig);

        expect(result).not.toBeNull();

        // ERA: 2.5 * -2 = -5
        // WHIP: 1.0 * -3 = -3
        // Total: -8
        expect(result!.totalScore).toBeCloseTo(-8, 1);
      });
    });

    describe('stat name format handling', () => {
      it('should handle direct match stat names', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 100,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores[0].statValue).toBe(100);
      });

      it('should handle camelCase stat names', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                homeRuns: 25, // camelCase
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        const homeRunScore = result!.categoryScores.find(
          (c) => c.categoryName === 'homeRuns',
        );
        expect(homeRunScore!.statValue).toBe(25);
      });

      it('should handle snake_case stat names', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                stolen_bases: 15, // snake_case
              },
            },
          ],
        };

        const config = {
          id: 'config-1',
          categories: {
            batting: {
              stolenBases: 2, // Config uses camelCase
            },
            pitching: {},
          },
        };

        const result = service.calculatePlayerScore(player, config);

        expect(result).not.toBeNull();
        const stolenBasesScore = result!.categoryScores.find(
          (c) => c.categoryName === 'stolenBases',
        );
        expect(stolenBasesScore!.statValue).toBe(15);
      });

      it('should parse string numbers', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: '120', // String number
                homeRuns: '30', // String number
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores[0].statValue).toBe(120);
        expect(result!.categoryScores[1].statValue).toBe(30);
      });

      it('should handle decimal string numbers', () => {
        const player = {
          id: 'player-2',
          position: 'P',
          statistics: [
            {
              statisticType: 'pitching',
              statistics: {
                era: '3.45', // String decimal
                whip: '1.15', // String decimal
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockPitchingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores[0].statValue).toBeCloseTo(3.45, 2);
        expect(result!.categoryScores[1].statValue).toBeCloseTo(1.15, 2);
      });

      it('should return null for unparseable stat values', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 'invalid', // Cannot parse
                homeRuns: 30,
              },
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        // Only homeRuns should be counted
        expect(result!.categoryScores).toHaveLength(1);
        expect(result!.categoryScores[0].categoryName).toBe('homeRuns');
      });
    });

    describe('edge cases', () => {
      it('should return null when player has no statistics', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).toBeNull();
      });

      it('should return null when statistics is undefined', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: undefined as any,
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).toBeNull();
      });

      it('should return null when no matching statistic type found', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'fielding', // Not batting or pitching
              statistics: {},
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).toBeNull();
      });

      it('should return empty breakdown when statistics JSONB is null', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: null,
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores).toHaveLength(0);
        expect(result!.totalScore).toBe(0);
      });

      it('should return empty breakdown when statistics JSONB is not an object', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: 'not-an-object',
            },
          ],
        };

        const result = service.calculatePlayerScore(player, mockBattingConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores).toHaveLength(0);
        expect(result!.totalScore).toBe(0);
      });

      it('should handle empty scoring categories', () => {
        const player = {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: {
                hits: 100,
                homeRuns: 30,
              },
            },
          ],
        };

        const emptyConfig = {
          id: 'config-empty',
          categories: {
            batting: {}, // No categories defined
            pitching: {},
          },
        };

        const result = service.calculatePlayerScore(player, emptyConfig);

        expect(result).not.toBeNull();
        expect(result!.categoryScores).toHaveLength(0);
        expect(result!.totalScore).toBe(0);
      });
    });
  });

  describe('calculatePlayerScores', () => {
    it('should calculate scores for multiple players', () => {
      const players = [
        {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 150, homeRuns: 30 },
            },
          ],
        },
        {
          id: 'player-2',
          position: '1B',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 180, homeRuns: 40 },
            },
          ],
        },
        {
          id: 'player-3',
          position: '2B',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 120, homeRuns: 10 },
            },
          ],
        },
      ];

      const result = service.calculatePlayerScores(players, mockBattingConfig);

      expect(result.size).toBe(3);
      expect(result.get('player-1')).toBe(270); // 150 + 30*4 = 270
      expect(result.get('player-2')).toBe(340); // 180 + 40*4 = 340
      expect(result.get('player-3')).toBe(160); // 120 + 10*4 = 160
    });

    it('should skip players with no calculable score', () => {
      const players = [
        {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 150 },
            },
          ],
        },
        {
          id: 'player-2',
          position: '1B',
          statistics: [], // No statistics
        },
        {
          id: 'player-3',
          position: '2B',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 120 },
            },
          ],
        },
      ];

      const result = service.calculatePlayerScores(players, mockBattingConfig);

      expect(result.size).toBe(2);
      expect(result.has('player-1')).toBe(true);
      expect(result.has('player-2')).toBe(false); // Skipped
      expect(result.has('player-3')).toBe(true);
    });

    it('should return empty map for empty player array', () => {
      const result = service.calculatePlayerScores([], mockBattingConfig);

      expect(result.size).toBe(0);
    });

    it('should handle mixed batters and pitchers', () => {
      const players = [
        {
          id: 'player-1',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { hits: 150 },
            },
          ],
        },
        {
          id: 'player-2',
          position: 'P',
          statistics: [
            {
              statisticType: 'pitching',
              statistics: { wins: 10 },
            },
          ],
        },
      ];

      // Use batting config - pitcher will have score of 0 (empty pitching categories)
      const result = service.calculatePlayerScores(players, mockBattingConfig);

      expect(result.size).toBe(2);
      expect(result.get('player-1')).toBe(150); // hits * 1
      expect(result.get('player-2')).toBe(0); // No batting categories match
    });
  });

  describe('case conversion utilities', () => {
    it('should convert snake_case to camelCase', () => {
      const testCases = [
        { input: 'home_runs', expected: 'homeRuns' },
        { input: 'stolen_bases', expected: 'stolenBases' },
        { input: 'batting_average', expected: 'battingAverage' },
        { input: 'earned_run_average', expected: 'earnedRunAverage' },
      ];

      for (const { input, expected } of testCases) {
        const player = {
          id: 'test',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { [input]: 100 },
            },
          ],
        };

        const config = {
          id: 'test-config',
          categories: {
            batting: { [expected]: 1 },
            pitching: {},
          },
        };

        const result = service.calculatePlayerScore(player, config);

        expect(result).not.toBeNull();
        expect(result!.categoryScores.length).toBeGreaterThan(0);
      }
    });

    it('should convert camelCase to snake_case', () => {
      const testCases = [
        { input: 'homeRuns', expected: 'home_runs' },
        { input: 'stolenBases', expected: 'stolen_bases' },
        { input: 'battingAverage', expected: 'batting_average' },
      ];

      for (const { input, expected } of testCases) {
        const player = {
          id: 'test',
          position: 'OF',
          statistics: [
            {
              statisticType: 'batting',
              statistics: { [expected]: 100 },
            },
          ],
        };

        const config = {
          id: 'test-config',
          categories: {
            batting: { [input]: 1 },
            pitching: {},
          },
        };

        const result = service.calculatePlayerScore(player, config);

        expect(result).not.toBeNull();
        expect(result!.categoryScores.length).toBeGreaterThan(0);
      }
    });
  });
});
