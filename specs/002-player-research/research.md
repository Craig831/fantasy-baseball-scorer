# Research: Player Research Feature

**Date**: 2025-10-29
**Feature**: Player Research
**Branch**: feature/player-research

## Overview

This document captures research findings for implementing player research functionality with MLB player data integration, performance optimization for score calculations, and saved search persistence.

## 1. MLB-StatsAPI Integration

### Decision

Use **MLB-StatsAPI** (https://github.com/toddrob99/MLB-StatsAPI) Python library wrapped in a Node.js microservice, OR use direct HTTP client to MLB Stats API endpoints if Python wrapper is problematic.

**Primary Approach**: Direct HTTP REST client to MLB Stats API endpoints
- Base URL: `https://statsapi.mlb.com/api/v1/`
- No authentication required (public API)
- No explicit rate limits documented
- JSON responses

### Rationale

- MLB-StatsAPI is free, open-source, and officially specified in platform requirements
- Direct REST integration avoids Python dependency and simplifies deployment
- Existing NestJS HTTP module (axios) can handle requests
- Caching strategy mitigates any potential rate limiting

### Key Endpoints

```
GET /people/search?names={name}           # Search players by name
GET /sports/1/players                     # Get all MLB players
GET /people/{playerId}                    # Get player details
GET /people/{playerId}/stats?stats=season # Get player season statistics
GET /teams                                # Get all MLB teams
GET /seasons                              # Get season information
```

### Response Format

Player data example:
```json
{
  "people": [{
    "id": 660271,
    "fullName": "Shohei Ohtani",
    "firstName": "Shohei",
    "lastName": "Ohtani",
    "primaryNumber": "17",
    "currentTeam": { "id": 108, "name": "Los Angeles Angels" },
    "primaryPosition": { "code": "D", "name": "Designated Hitter", "type": "Hitter" },
    "batSide": { "code": "L" },
    "pitchHand": { "code": "R" },
    "active": true
  }]
}
```

Statistics example:
```json
{
  "stats": [{
    "type": { "displayName": "season" },
    "group": { "displayName": "hitting" },
    "splits": [{
      "season": "2024",
      "stat": {
        "gamesPlayed": 157,
        "atBats": 599,
        "runs": 134,
        "hits": 185,
        "doubles": 38,
        "triples": 7,
        "homeRuns": 54,
        "rbi": 130,
        "avg": ".310",
        "obp": ".390",
        "slg": ".646"
      }
    }]
  }]
}
```

### Data Mapping

MLB-StatsAPI to Database:
- `id` → `mlbPlayerId` (external ID)
- `fullName` → `name`
- `currentTeam.name` → `team`
- `primaryPosition.name` → `position`
- `active` → `status`
- `stats.splits[].stat` → JSONB column `statistics`

### Refresh Strategy

**Hourly batch updates** during active season (March-October):
- Scheduled job runs hourly via NestJS `@nestjs/schedule`
- Fetches updates for all active players
- Updates cached statistics in PostgreSQL
- Stores `lastUpdated` timestamp
- Off-season: daily updates

## 2. Player Statistics Caching Strategy

### Decision

Use **PostgreSQL with JSONB columns** for statistics storage

### Rationale

- Flexible schema for diverse statistics (batting vs. pitching)
- Efficient querying with GIN indices on JSONB
- Avoids need for separate columns for each stat
- Supports aggregation queries for filtering

### Cache Structure

```sql
Player table:
- id (UUID, primary key)
- mlbPlayerId (integer, unique, indexed)
- name (text)
- position (text, indexed)
- team (text, indexed)
- status (text) -- 'active', 'inactive', 'retired'
- lastUpdated (timestamp)

PlayerStatistic table:
- id (UUID, primary key)
- playerId (UUID, foreign key to Player)
- season (integer, indexed)
- statisticType (text) -- 'batting', 'pitching'
- statistics (JSONB) -- raw stats from MLB API
- dateFrom (date, indexed)
- dateTo (date, indexed)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Invalidation Strategy

Time-based cache expiration:
- Statistics older than 1 hour during active games → stale
- Check `lastUpdated` timestamp before serving
- Background job refreshes stale data hourly
- Manual refresh trigger available for admins

### Query Patterns

Common filter queries:
```sql
-- Filter by position
SELECT * FROM Player WHERE position = 'Pitcher';

-- Filter by team
SELECT * FROM Player WHERE team = 'Yankees';

-- Filter by date range with stats
SELECT p.*, ps.statistics
FROM Player p
JOIN PlayerStatistic ps ON p.id = ps.playerId
WHERE ps.dateFrom >= '2024-04-01'
  AND ps.dateTo <= '2024-09-30';

-- Search by name
SELECT * FROM Player WHERE name ILIKE '%ohtani%';
```

Indices required:
- `Player.position` (btree)
- `Player.team` (btree)
- `Player.mlbPlayerId` (unique btree)
- `PlayerStatistic.playerId` (btree)
- `PlayerStatistic.dateFrom, dateTo` (btree)
- `PlayerStatistic.statistics` (GIN for JSONB queries)

## 3. Score Calculation Performance

### Decision

**Server-side calculation with selective caching**

### Rationale

- Ensures consistency across all clients
- Allows complex scoring logic without client-side complexity
- Reduces client payload size
- Enables future optimization (materialized views, pre-calculation)

### Calculation Approach

1. **On-demand calculation**: Calculate scores when player list is requested
2. **Batch processing**: Calculate all player scores in single database query
3. **Scoring configuration joins**: Join player statistics with user's active scoring config
4. **JSONB extraction**: Use PostgreSQL JSONB operators for efficient stat extraction

### Performance Optimization

```sql
-- Example score calculation query
WITH player_scores AS (
  SELECT
    p.id,
    p.name,
    p.position,
    (
      COALESCE((ps.statistics->>'homeRuns')::int, 0) * sc.homeRunPoints +
      COALESCE((ps.statistics->>'rbi')::int, 0) * sc.rbiPoints +
      COALESCE((ps.statistics->>'hits')::int, 0) * sc.hitPoints
      -- ... more stat calculations
    ) AS totalScore
  FROM Player p
  JOIN PlayerStatistic ps ON p.id = ps.playerId
  CROSS JOIN ScoringConfiguration sc
  WHERE sc.id = :configId
    AND ps.season = :season
    AND ps.dateFrom >= :fromDate
    AND ps.dateTo <= :toDate
)
SELECT * FROM player_scores
ORDER BY totalScore DESC
LIMIT 50 OFFSET :offset;
```

### Caching Strategy

**Conditional caching**:
- Cache calculated scores for historical date ranges (immutable)
- Do NOT cache current season scores (statistics update hourly)
- Cache key: `scores:{configId}:{season}:{dateFrom}:{dateTo}:{filters}`
- TTL: 24 hours for historical data, no cache for current data

### Calculation Complexity

- O(n) where n = number of filtered players (max 50 per page)
- Single SQL query with joins
- Target: < 200ms for score calculation
- Fallback: Pre-calculate top 100 players per config (background job)

## 4. Saved Search Data Model

### Decision

Store saved searches as **JSON objects** with reference to scoring configuration

### Rationale

- Flexible filter structure (new filters can be added without schema changes)
- Easy serialization/deserialization
- Maintains relationship to scoring configuration (not embedded)
- Versioning handled through filter schema evolution

### Data Model

```sql
SavedSearch table:
- id (UUID, primary key)
- userId (UUID, foreign key to User, indexed)
- name (text) -- user-provided name
- filters (JSONB) -- { position, team, dateFrom, dateTo, ... }
- scoringConfigurationId (UUID, nullable, foreign key)
- createdAt (timestamp)
- updatedAt (timestamp)

Unique constraint: (userId, name)
```

### Filter Structure

```json
{
  "position": "Pitcher",
  "team": "Yankees",
  "dateFrom": "2024-04-01",
  "dateTo": "2024-09-30",
  "sortBy": "score",
  "sortOrder": "desc"
}
```

### Versioning Strategy

**Schema evolution approach**:
- Saved searches include filter version metadata
- New filter fields are additive (backward compatible)
- Deprecated fields are ignored (graceful degradation)
- Version field: `filterVersion: 1`

Example evolution:
```json
// Version 1
{ "position": "Pitcher" }

// Version 2 (adds new filter)
{ "position": "Pitcher", "minGamesPlayed": 50, "filterVersion": 2 }
```

### Best Practices

- Validate filter structure on save (schema validation)
- Limit to 50 saved searches per user (prevent abuse)
- Include scoring configuration ID (not embedded config data)
- Support null scoring configuration (shows raw stats)
- Audit log for saved search CRUD operations

## 5. Additional Considerations

### API Rate Limiting

MLB-StatsAPI has no documented rate limits, but implement defensive strategies:
- Exponential backoff on errors
- Circuit breaker pattern for external API calls
- Fallback to cached data if API unavailable
- Monitor response times and error rates

### Database Indices

Critical indices for performance:
```sql
CREATE INDEX idx_player_position ON Player(position);
CREATE INDEX idx_player_team ON Player(team);
CREATE INDEX idx_player_mlb_id ON Player(mlbPlayerId);
CREATE INDEX idx_player_status ON Player(status);
CREATE INDEX idx_player_stat_player_id ON PlayerStatistic(playerId);
CREATE INDEX idx_player_stat_dates ON PlayerStatistic(dateFrom, dateTo);
CREATE INDEX idx_player_stat_season ON PlayerStatistic(season);
CREATE INDEX idx_player_stat_jsonb ON PlayerStatistic USING GIN(statistics);
CREATE INDEX idx_saved_search_user ON SavedSearch(userId);
```

### Error Handling

- Graceful degradation if MLB API is down (serve cached data with warning)
- Clear error messages for empty result sets
- Retry logic for transient failures
- Logging for debugging and monitoring

### Testing Strategy

- Unit tests for score calculation logic
- Integration tests for MLB API client
- E2E tests for search/filter workflows
- Performance tests for large player datasets
- Mock MLB API responses for consistent testing

## Alternatives Considered

### MLB-StatsAPI Integration

**Alternative**: Use Python MLB-StatsAPI library via subprocess
- **Rejected**: Adds Python runtime dependency, increases deployment complexity, inter-process communication overhead

**Alternative**: Real-time API calls on every search
- **Rejected**: Introduces latency, creates dependency on external API availability, potential rate limiting issues

### Statistics Storage

**Alternative**: Relational model with columns for each statistic
- **Rejected**: Inflexible (new stats require schema migration), excessive column count for comprehensive stats

**Alternative**: Separate table per statistic type
- **Rejected**: Complex queries, denormalized structure, harder to maintain

### Score Calculation

**Alternative**: Client-side calculation
- **Rejected**: Inconsistent across clients, larger payload size, security concerns (scoring logic exposed)

**Alternative**: Pre-calculate all player scores for all configurations
- **Rejected**: Exponential complexity (players × configs × date ranges), storage overhead, stale data issues

### Saved Searches

**Alternative**: Query string serialization
- **Rejected**: Limited flexibility, harder to version, difficult to parse complex filters

**Alternative**: Embed scoring configuration in saved search
- **Rejected**: Data duplication, stale scoring rules if config updated, storage overhead

## References

- [MLB-StatsAPI GitHub](https://github.com/toddrob99/MLB-StatsAPI)
- [MLB Stats API Documentation](https://appac.github.io/mlb-data-api-docs/)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [NestJS Schedule Module](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma JSONB Support](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)

## Summary

This research establishes:
1. Direct HTTP integration with MLB Stats API for player data
2. PostgreSQL with JSONB for flexible statistics caching
3. Server-side score calculation with selective caching
4. JSON-based saved search model with scoring config references

All decisions support the feature requirements while maintaining performance, scalability, and maintainability goals.
