# Data Model: Player Research

**Feature**: Player Research
**Branch**: feature/player-research
**Date**: 2025-11-09 (Updated)

## Overview

This document defines the data models for player research functionality, including MLB player entities, statistics caching, and saved search persistence with support for the updated filter panel (statistic type toggle, season, status, date range, position checkboxes) and dynamic column display based on scoring configuration. Models extend the existing database schema (User, ScoringConfiguration, AuditLog).

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │◄────────┐
│ (existing)      │         │
└─────────────────┘         │
                            │
                            │
┌─────────────────┐         │
│ ScoringConfig   │◄────────┼────────┐
│ (existing)      │         │        │
└─────────────────┘         │        │
                            │        │
                            │        │
┌─────────────────┐         │        │
│  SavedSearch    │─────────┼────────┘
│  - id           │         │
│  - userId       │─────────┘
│  - name         │
│  - filters      │
│  - configId     │
│  - createdAt    │
│  - updatedAt    │
└─────────────────┘


┌─────────────────┐
│     Player      │
│  - id           │
│  - mlbPlayerId  │◄────────┐
│  - name         │         │
│  - position     │         │
│  - team         │         │
│  - status       │         │
│  - lastUpdated  │         │
│  - createdAt    │         │
└─────────────────┘         │
                            │
                            │
┌─────────────────┐         │
│ PlayerStatistic │─────────┘
│  - id           │
│  - playerId     │
│  - season       │
│  - statType     │
│  - statistics   │ (JSONB)
│  - dateFrom     │
│  - dateTo       │
│  - createdAt    │
│  - updatedAt    │
└─────────────────┘
```

## Data Models

### Player

Represents an MLB player with current team and position information.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Internal unique identifier |
| mlbPlayerId | Integer | Unique, Not Null, Indexed | External MLB Stats API player ID |
| name | String | Not Null | Player full name |
| position | String | Not Null, Indexed | Primary position (Pitcher, Catcher, First Base, etc.) |
| team | String | Not Null, Indexed | Current MLB team name |
| status | String | Not Null, Indexed | Player status ('active', 'inactive', 'retired') |
| lastUpdated | DateTime | Not Null | Timestamp of last data refresh from MLB API |
| createdAt | DateTime | Not Null | Record creation timestamp |

**Relationships**:
- One-to-Many with PlayerStatistic (player has many statistics records)

**Validation Rules**:
- `mlbPlayerId` must be positive integer
- `position` must be one of: Pitcher, Catcher, First Base, Second Base, Third Base, Shortstop, Outfield, Designated Hitter
- `status` must be one of: active, inactive, retired
- `team` must be valid MLB team name (30 teams)
- `name` minimum length 2 characters

**Indices**:
- Primary key on `id`
- Unique index on `mlbPlayerId`
- Index on `position` (for filtering)
- Index on `team` (for filtering)
- Index on `status` (for active player queries)
- Composite index on `(position, team)` (for combined filters)

**State Transitions**:
```
active → inactive (player injured/suspended)
active → retired (player retires)
inactive → active (player returns)
```

---

### PlayerStatistic

Stores time-series statistics for players, supporting flexible stat storage via JSONB.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Internal unique identifier |
| playerId | UUID | Foreign Key to Player, Not Null, Indexed | Reference to Player |
| season | Integer | Not Null, Indexed | MLB season year (e.g., 2024) |
| statisticType | String | Not Null | Type of statistics ('batting', 'pitching') |
| statistics | JSONB | Not Null | Raw statistics data from MLB API |
| dateFrom | Date | Not Null, Indexed | Start date for statistics period |
| dateTo | Date | Not Null, Indexed | End date for statistics period |
| createdAt | DateTime | Not Null | Record creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

**Relationships**:
- Many-to-One with Player (many statistics belong to one player)

**Validation Rules**:
- `season` must be >= 1876 (first MLB season) and <= current year + 1
- `statisticType` must be one of: batting, pitching
- `dateFrom` must be <= `dateTo`
- `statistics` JSONB must conform to expected schema (validated in application)
- Unique constraint on `(playerId, season, statisticType, dateFrom, dateTo)`

**Statistics JSONB Schema**:

Batting statistics:
```json
{
  "gamesPlayed": 157,
  "atBats": 599,
  "runs": 134,
  "hits": 185,
  "doubles": 38,
  "triples": 7,
  "homeRuns": 54,
  "rbi": 130,
  "stolenBases": 31,
  "caughtStealing": 7,
  "walks": 81,
  "strikeouts": 156,
  "avg": ".310",
  "obp": ".390",
  "slg": ".646",
  "ops": "1.036"
}
```

Pitching statistics:
```json
{
  "gamesPlayed": 32,
  "gamesStarted": 32,
  "completeGames": 1,
  "shutouts": 1,
  "wins": 16,
  "losses": 7,
  "saves": 0,
  "inningsPitched": "201.2",
  "hits": 165,
  "runs": 72,
  "earnedRuns": 67,
  "homeRuns": 22,
  "walks": 48,
  "strikeouts": 234,
  "era": "2.99",
  "whip": "1.06"
}
```

**Indices**:
- Primary key on `id`
- Index on `playerId` (for player lookups)
- Index on `season` (for season filtering)
- Composite index on `(dateFrom, dateTo)` (for date range queries)
- GIN index on `statistics` (for JSONB queries)
- Unique index on `(playerId, season, statisticType, dateFrom, dateTo)`

---

### SavedSearch

Stores user-defined search filter combinations for quick reuse.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Internal unique identifier |
| userId | UUID | Foreign Key to User, Not Null, Indexed | Owner of the saved search |
| name | String | Not Null | User-provided name for the search |
| filters | JSONB | Not Null | Serialized filter criteria |
| scoringConfigurationId | UUID | Foreign Key to ScoringConfiguration, Nullable | Optional scoring config reference |
| createdAt | DateTime | Not Null | Record creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

**Relationships**:
- Many-to-One with User (many saved searches belong to one user)
- Many-to-One with ScoringConfiguration (many saved searches reference one config)

**Validation Rules**:
- `name` length 1-100 characters
- Unique constraint on `(userId, name)` (user cannot have duplicate search names)
- `filters` JSONB must be valid JSON object
- Maximum 50 saved searches per user (enforced in application)
- If `scoringConfigurationId` is provided, must reference existing configuration

**Filters JSONB Schema**:

```json
{
  "filterVersion": 2,
  "statisticType": "batting",
  "positions": ["First Base", "Third Base"],
  "season": 2024,
  "status": "active",
  "dateRange": {
    "from": "2024-04-01",
    "to": "2024-09-30"
  },
  "sortBy": "totalPoints",
  "sortOrder": "desc"
}
```

**Filter Fields** (all optional unless noted):
- `filterVersion` (integer, required): Schema version for evolution (current: 2)
- `statisticType` (string): Player type filter - 'batting' or 'pitching' (default: 'batting')
- `positions` (array of strings): Player positions filter (empty array = all positions)
  - Batter positions: "Catcher", "First Base", "Second Base", "Third Base", "Shortstop", "Outfield", "Designated Hitter"
  - Pitcher positions: "Pitcher"
- `season` (integer): MLB season year (default: current year, must be 1876-present)
- `status` (string): Player status filter - 'active', 'inactive', 'retired' (default: 'active')
- `dateRange` (object): Date range for statistics
  - `from` (ISO date string, nullable): Start date (null = season start)
  - `to` (ISO date string, nullable): End date (null = current date or season end)
- `sortBy` (string): Sort column - 'totalPoints', 'pointsPerGame', 'name', 'position', 'team', or stat field keys (default: 'totalPoints')
- `sortOrder` (string): Sort direction - 'asc' or 'desc' (default: 'desc')

**Schema Evolution Notes**:
- **Version 1**: Original schema with `position` (string), `team` (string), `dateFrom`/`dateTo` separate fields
- **Version 2** (current): Added `statisticType`, changed `position` to `positions` (array), added `season`, added `dateRange` object, removed `team` filter

**Indices**:
- Primary key on `id`
- Index on `userId` (for user's saved searches)
- Unique index on `(userId, name)`

**State Transitions**:
- None (simple CRUD entity)

---

## Prisma Schema Extensions

The following Prisma schema models will be added:

```prisma
model Player {
  id            String             @id @default(uuid())
  mlbPlayerId   Int                @unique @map("mlb_player_id")
  name          String
  position      String
  team          String
  status        String
  lastUpdated   DateTime           @map("last_updated")
  createdAt     DateTime           @default(now()) @map("created_at")

  statistics    PlayerStatistic[]

  @@index([position])
  @@index([team])
  @@index([status])
  @@index([position, team])
  @@map("players")
}

model PlayerStatistic {
  id            String   @id @default(uuid())
  playerId      String   @map("player_id")
  season        Int
  statisticType String   @map("statistic_type")
  statistics    Json
  dateFrom      DateTime @map("date_from")
  dateTo        DateTime @map("date_to")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  player        Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([playerId, season, statisticType, dateFrom, dateTo])
  @@index([playerId])
  @@index([season])
  @@index([dateFrom, dateTo])
  @@map("player_statistics")
}

model SavedSearch {
  id                      String                  @id @default(uuid())
  userId                  String                  @map("user_id")
  name                    String
  filters                 Json
  scoringConfigurationId  String?                 @map("scoring_configuration_id")
  createdAt               DateTime                @default(now()) @map("created_at")
  updatedAt               DateTime                @updatedAt @map("updated_at")

  user                    User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  scoringConfiguration    ScoringConfiguration?   @relation(fields: [scoringConfigurationId], references: [id], onDelete: SetNull)

  @@unique([userId, name])
  @@index([userId])
  @@map("saved_searches")
}
```

## Integration with Existing Models

### User Model (existing)

Add relation:
```prisma
model User {
  // ... existing fields
  savedSearches SavedSearch[]
}
```

### ScoringConfiguration Model (existing)

Add relation:
```prisma
model ScoringConfiguration {
  // ... existing fields
  savedSearches SavedSearch[]
}
```

## Migration Considerations

1. **Add new tables**: Player, PlayerStatistic, SavedSearch
2. **Add foreign key constraints**: SavedSearch → User, SavedSearch → ScoringConfiguration, PlayerStatistic → Player
3. **Create indices**: As specified in each model
4. **JSONB support**: Ensure PostgreSQL JSONB support enabled
5. **Initial data load**: Background job to populate Player and PlayerStatistic tables from MLB API

## Data Volume Estimates

- **Players**: ~1,200 active MLB players
- **PlayerStatistics**: ~2,400 records per season (1,200 players × 2 stat types)
- **SavedSearches**: Up to 50 per user × estimated 1,000 users = 50,000 records

## Performance Considerations

- Composite indices on frequently combined filters (position + team)
- GIN index on JSONB columns for flexible queries
- Partitioning PlayerStatistic by season if volume grows significantly
- Regular VACUUM and ANALYZE on statistics tables
- Monitor query performance with EXPLAIN ANALYZE

## Security Considerations

- SavedSearch records are user-scoped (row-level security)
- Player and PlayerStatistic data is public (no sensitive information)
- Audit logging for SavedSearch CRUD operations (via existing AuditLog)
- Input validation on filter JSONB to prevent injection attacks

## Validation Summary

All models include:
- Primary key constraints
- Foreign key constraints with cascade/set null behaviors
- Appropriate indices for query patterns
- Timestamp fields for auditing
- JSONB validation in application layer
- Unique constraints where appropriate
