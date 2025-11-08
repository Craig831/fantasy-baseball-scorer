import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchPlayersDto, PlayerStatus } from './search-players.dto';

describe('SearchPlayersDto', () => {
  describe('position', () => {
    it('should accept an array of strings', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        position: ['P', 'DH', '1B'],
      });

      const errors = await validate(dto);
      const positionErrors = errors.filter((e) => e.property === 'position');

      expect(positionErrors).toHaveLength(0);
      expect(dto.position).toEqual(['P', 'DH', '1B']);
    });

    it('should transform a single string to an array', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        position: 'P',
      });

      const errors = await validate(dto);
      const positionErrors = errors.filter((e) => e.property === 'position');

      expect(positionErrors).toHaveLength(0);
      expect(dto.position).toEqual(['P']);
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const positionErrors = errors.filter((e) => e.property === 'position');

      expect(positionErrors).toHaveLength(0);
    });

    it('should reject non-string array elements', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        position: ['P', 123, 'DH'],
      });

      const errors = await validate(dto);
      const positionErrors = errors.filter((e) => e.property === 'position');

      expect(positionErrors.length).toBeGreaterThan(0);
    });
  });

  describe('league', () => {
    it('should accept valid league values (AL, NL, both)', async () => {
      const validLeagues = ['AL', 'NL', 'both'];

      for (const league of validLeagues) {
        const dto = plainToInstance(SearchPlayersDto, { league });
        const errors = await validate(dto);
        const leagueErrors = errors.filter((e) => e.property === 'league');

        expect(leagueErrors).toHaveLength(0);
      }
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const leagueErrors = errors.filter((e) => e.property === 'league');

      expect(leagueErrors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        league: 123,
      });

      const errors = await validate(dto);
      const leagueErrors = errors.filter((e) => e.property === 'league');

      expect(leagueErrors.length).toBeGreaterThan(0);
    });
  });

  describe('status', () => {
    it('should accept valid PlayerStatus enum values', async () => {
      const validStatuses = [
        PlayerStatus.ACTIVE,
        PlayerStatus.INACTIVE,
        PlayerStatus.INJURED,
      ];

      for (const status of validStatuses) {
        const dto = plainToInstance(SearchPlayersDto, { status });
        const errors = await validate(dto);
        const statusErrors = errors.filter((e) => e.property === 'status');

        expect(statusErrors).toHaveLength(0);
      }
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const statusErrors = errors.filter((e) => e.property === 'status');

      expect(statusErrors).toHaveLength(0);
    });

    it('should reject invalid status values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        status: 'invalid-status' as any,
      });

      const errors = await validate(dto);
      const statusErrors = errors.filter((e) => e.property === 'status');

      expect(statusErrors.length).toBeGreaterThan(0);
    });
  });

  describe('season', () => {
    it('should accept valid season years', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: 2024,
      });

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors).toHaveLength(0);
      expect(dto.season).toBe(2024);
    });

    it('should transform string to number', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: '2024',
      });

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors).toHaveLength(0);
      expect(dto.season).toBe(2024);
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors).toHaveLength(0);
    });

    it('should reject seasons below minimum (1900)', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: 1899,
      });

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors.length).toBeGreaterThan(0);
    });

    it('should reject seasons above maximum (2100)', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: 2101,
      });

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors.length).toBeGreaterThan(0);
    });

    it('should reject non-integer values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: 2024.5,
      });

      const errors = await validate(dto);
      const seasonErrors = errors.filter((e) => e.property === 'season');

      expect(seasonErrors.length).toBeGreaterThan(0);
    });
  });

  describe('dateFrom and dateTo', () => {
    it('should accept valid ISO date strings', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        dateFrom: '2024-04-01',
        dateTo: '2024-10-31',
      });

      const errors = await validate(dto);
      const dateErrors = errors.filter(
        (e) => e.property === 'dateFrom' || e.property === 'dateTo',
      );

      expect(dateErrors).toHaveLength(0);
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const dateErrors = errors.filter(
        (e) => e.property === 'dateFrom' || e.property === 'dateTo',
      );

      expect(dateErrors).toHaveLength(0);
    });

    it('should reject invalid date formats', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        dateFrom: 'not-a-date',
        dateTo: '01/31/2024',
      });

      const errors = await validate(dto);
      const dateErrors = errors.filter(
        (e) => e.property === 'dateFrom' || e.property === 'dateTo',
      );

      expect(dateErrors.length).toBeGreaterThan(0);
    });
  });

  describe('page', () => {
    it('should accept valid page numbers', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        page: 5,
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');

      expect(pageErrors).toHaveLength(0);
      expect(dto.page).toBe(5);
    });

    it('should transform string to number', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        page: '3',
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');

      expect(pageErrors).toHaveLength(0);
      expect(dto.page).toBe(3);
    });

    it('should default to 1', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      expect(dto.page).toBe(1);
    });

    it('should reject page numbers less than 1', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        page: 0,
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');

      expect(pageErrors.length).toBeGreaterThan(0);
    });

    it('should reject negative page numbers', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        page: -1,
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');

      expect(pageErrors.length).toBeGreaterThan(0);
    });

    it('should reject non-integer values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        page: 1.5,
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');

      expect(pageErrors.length).toBeGreaterThan(0);
    });
  });

  describe('limit', () => {
    it('should accept valid limit values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        limit: 25,
      });

      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');

      expect(limitErrors).toHaveLength(0);
      expect(dto.limit).toBe(25);
    });

    it('should transform string to number', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        limit: '50',
      });

      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');

      expect(limitErrors).toHaveLength(0);
      expect(dto.limit).toBe(50);
    });

    it('should default to 50', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      expect(dto.limit).toBe(50);
    });

    it('should reject limit values less than 1', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        limit: 0,
      });

      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');

      expect(limitErrors.length).toBeGreaterThan(0);
    });

    it('should reject limit values greater than 100', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        limit: 101,
      });

      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');

      expect(limitErrors.length).toBeGreaterThan(0);
    });

    it('should reject non-integer values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        limit: 50.5,
      });

      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');

      expect(limitErrors.length).toBeGreaterThan(0);
    });
  });

  describe('scoringConfigId', () => {
    it('should accept valid UUIDs', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        scoringConfigId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const errors = await validate(dto);
      const configErrors = errors.filter(
        (e) => e.property === 'scoringConfigId',
      );

      expect(configErrors).toHaveLength(0);
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const configErrors = errors.filter(
        (e) => e.property === 'scoringConfigId',
      );

      expect(configErrors).toHaveLength(0);
    });

    it('should reject invalid UUID formats', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        scoringConfigId: 'not-a-uuid',
      });

      const errors = await validate(dto);
      const configErrors = errors.filter(
        (e) => e.property === 'scoringConfigId',
      );

      expect(configErrors.length).toBeGreaterThan(0);
    });
  });

  describe('statisticType', () => {
    it('should accept valid statistic types (hitting, pitching)', async () => {
      const validTypes = ['hitting', 'pitching'];

      for (const statisticType of validTypes) {
        const dto = plainToInstance(SearchPlayersDto, { statisticType });
        const errors = await validate(dto);
        const typeErrors = errors.filter((e) => e.property === 'statisticType');

        expect(typeErrors).toHaveLength(0);
      }
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const typeErrors = errors.filter((e) => e.property === 'statisticType');

      expect(typeErrors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        statisticType: 123,
      });

      const errors = await validate(dto);
      const typeErrors = errors.filter((e) => e.property === 'statisticType');

      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('sortBy', () => {
    it('should accept valid sort fields', async () => {
      const validFields = [
        'score',
        'name',
        'position',
        'team',
        'season',
        'status',
      ];

      for (const sortBy of validFields) {
        const dto = plainToInstance(SearchPlayersDto, { sortBy });
        const errors = await validate(dto);
        const sortErrors = errors.filter((e) => e.property === 'sortBy');

        expect(sortErrors).toHaveLength(0);
      }
    });

    it('should be optional', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);
      const sortErrors = errors.filter((e) => e.property === 'sortBy');

      expect(sortErrors).toHaveLength(0);
    });

    it('should reject non-string values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        sortBy: 123,
      });

      const errors = await validate(dto);
      const sortErrors = errors.filter((e) => e.property === 'sortBy');

      expect(sortErrors.length).toBeGreaterThan(0);
    });
  });

  describe('sortOrder', () => {
    it('should accept valid sort orders (asc, desc)', async () => {
      const validOrders = ['asc', 'desc'];

      for (const sortOrder of validOrders) {
        const dto = plainToInstance(SearchPlayersDto, { sortOrder });
        const errors = await validate(dto);
        const orderErrors = errors.filter((e) => e.property === 'sortOrder');

        expect(orderErrors).toHaveLength(0);
      }
    });

    it('should default to desc', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      expect(dto.sortOrder).toBe('desc');
    });

    it('should reject non-string values', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        sortOrder: 123,
      });

      const errors = await validate(dto);
      const orderErrors = errors.filter((e) => e.property === 'sortOrder');

      expect(orderErrors.length).toBeGreaterThan(0);
    });
  });

  describe('complex scenarios', () => {
    it('should validate a fully populated DTO', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        position: ['P', 'DH'],
        league: 'AL',
        status: PlayerStatus.ACTIVE,
        season: 2024,
        dateFrom: '2024-04-01',
        dateTo: '2024-10-31',
        page: 2,
        limit: 25,
        scoringConfigId: '123e4567-e89b-12d3-a456-426614174000',
        statisticType: 'hitting',
        sortBy: 'score',
        sortOrder: 'desc',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate an empty DTO with defaults', async () => {
      const dto = plainToInstance(SearchPlayersDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(50);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should report multiple validation errors', async () => {
      const dto = plainToInstance(SearchPlayersDto, {
        season: 1800, // Too old
        page: -1, // Negative
        limit: 200, // Too large
        scoringConfigId: 'invalid-uuid',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(3);
    });
  });
});
