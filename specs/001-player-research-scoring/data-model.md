# Data Model: Player Research and Scoring Platform

**Feature**: 001-player-research-scoring
**Date**: 2025-10-24
**Phase**: 1 - Data Model and Entity Design

## Overview

This document defines the database schema, entity relationships, and data constraints for the Player Research and Scoring Platform. The schema is designed for PostgreSQL 15+ with Prisma ORM.

## Entity-Relationship Diagram

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ScoringConfig │  │   Lineup     │  │  AuditLog    │  │ RefreshToken │
└──────────────┘  └──────┬───────┘  └──────────────┘  └──────────────┘
                         │
                         │ 1:N
                         │
                         ▼
                  ┌──────────────┐
                  │ LineupSlot   │
                  └──────┬───────┘
                         │
                         │ N:1
                         │
                         ▼
                  ┌──────────────┐
                  │   Player     │
                  └──────┬───────┘
                         │
                         │ 1:N
                         │
                         ▼
                  ┌──────────────┐
                  │PlayerStatistic│
                  └──────────────┘
```

## Entities

### User

**Purpose**: Registered user account with authentication and profile information.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(60) | NOT NULL | bcrypt hash (cost 12) |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| email_verification_token | VARCHAR(255) | NULLABLE | Token for email verification |
| mfa_enabled | BOOLEAN | DEFAULT false | MFA status |
| mfa_secret | VARCHAR(255) | NULLABLE, ENCRYPTED | TOTP secret (encrypted at rest) |
| privacy_settings | JSONB | DEFAULT '{}' | User privacy preferences |
| created_at | TIMESTAMP | NOT NULL | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last profile update |
| last_login_at | TIMESTAMP | NULLABLE | Last successful login |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes**:
- `idx_users_email` (UNIQUE): Email lookups during login
- `idx_users_email_verified`: Filter verified users
- `idx_users_deleted_at`: Exclude soft-deleted users

**Validation Rules**:
- Email: RFC 5322 format validation
- Password: Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- MFA secret: Only set when mfa_enabled = true

**Relationships**:
- `scoringConfigs`: One-to-many with ScoringConfiguration
- `lineups`: One-to-many with Lineup
- `auditLogs`: One-to-many with AuditLog
- `refreshTokens`: One-to-many with RefreshToken

---

### ScoringConfiguration

**Purpose**: User-defined scoring system for baseball statistics.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique config identifier |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Owner of config |
| name | VARCHAR(100) | NOT NULL | User-defined config name |
| categories | JSONB | NOT NULL | Stat categories and point values |
| is_active | BOOLEAN | DEFAULT false | Default config for user |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**JSONB Schema (categories)**:
```json
{
  "batting": {
    "hits": 1.0,
    "doubles": 2.0,
    "triples": 3.0,
    "homeRuns": 4.0,
    "runs": 1.0,
    "rbis": 1.0,
    "stolenBases": 2.0,
    "walks": 1.0,
    "strikeouts": -0.5
  },
  "pitching": {
    "wins": 5.0,
    "saves": 5.0,
    "strikeouts": 1.0,
    "earnedRuns": -1.0,
    "walks": -0.5,
    "holds": 3.0
  }
}
```

**Indexes**:
- `idx_scoring_configs_user_id`: Fetch user's configs
- `idx_scoring_configs_user_active`: Find active config per user
- `idx_scoring_configs_categories_gin`: JSONB queries (GIN index)

**Validation Rules**:
- Name: Max 100 chars, non-empty
- Categories: Valid JSONB, all values numeric
- Only one is_active = true per user_id

**Constraints**:
- `unique_active_config`: UNIQUE (user_id) WHERE is_active = true
- `valid_point_values`: CHECK all values in categories are numeric

**Relationships**:
- `user`: Many-to-one with User
- `lineups`: One-to-many with Lineup (optional association)

---

### Player

**Purpose**: MLB player database with current season information.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PRIMARY KEY | MLB player ID (from API) |
| name | VARCHAR(255) | NOT NULL | Full player name |
| team | VARCHAR(10) | NOT NULL | MLB team code (NYY, BOS, etc.) |
| position | VARCHAR(20) | NOT NULL | Primary position (C, 1B, 2B, SS, 3B, OF, P) |
| jersey_number | INTEGER | NULLABLE | Jersey number |
| active | BOOLEAN | DEFAULT true | Currently active in MLB |
| season | INTEGER | NOT NULL | Current season year |
| created_at | TIMESTAMP | NOT NULL | Database insert timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| synced_at | TIMESTAMP | NOT NULL | Last MLB API sync timestamp |

**Indexes**:
- `idx_players_team_position`: Filter by team and position (most common query)
- `idx_players_name_fts`: Full-text search on player name (GIN index)
- `idx_players_active_season`: Filter active players in current season
- `idx_players_synced_at`: Identify stale players needing sync

**Validation Rules**:
- Position: Must be one of (C, 1B, 2B, SS, 3B, OF, P, DH, UT)
- Team: Must be valid MLB team code (30 teams)
- Season: Must be ≥ 2020 (earliest supported season)

**Relationships**:
- `statistics`: One-to-many with PlayerStatistic
- `lineupSlots`: One-to-many with LineupSlot

---

### PlayerStatistic

**Purpose**: Individual game or season statistics for a player.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique stat record identifier |
| player_id | VARCHAR(50) | FOREIGN KEY (players.id), NOT NULL | Associated player |
| stat_date | DATE | NOT NULL | Game date or season date |
| opponent | VARCHAR(10) | NULLABLE | Opponent team code |
| is_season_total | BOOLEAN | DEFAULT false | Season aggregate vs. game stat |
| batting_stats | JSONB | DEFAULT '{}' | Batting statistics |
| pitching_stats | JSONB | DEFAULT '{}' | Pitching statistics (for pitchers) |
| created_at | TIMESTAMP | NOT NULL | Database insert timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**JSONB Schema (batting_stats)**:
```json
{
  "atBats": 4,
  "hits": 2,
  "doubles": 1,
  "triples": 0,
  "homeRuns": 0,
  "runs": 1,
  "rbis": 2,
  "stolenBases": 0,
  "caughtStealing": 0,
  "walks": 0,
  "strikeouts": 1,
  "battingAverage": 0.500,
  "onBasePercentage": 0.500,
  "sluggingPercentage": 0.750
}
```

**JSONB Schema (pitching_stats)**:
```json
{
  "inningsPitched": 6.0,
  "hits": 4,
  "runs": 2,
  "earnedRuns": 2,
  "walks": 2,
  "strikeouts": 7,
  "homeRuns": 1,
  "wins": 1,
  "losses": 0,
  "saves": 0,
  "holds": 0,
  "era": 3.00,
  "whip": 1.00
}
```

**Indexes**:
- `idx_player_stats_player_date`: Fetch player stats for date range
- `idx_player_stats_season_total`: Quick access to season totals
- `idx_player_stats_batting_gin`: JSONB queries on batting stats (GIN index)
- `idx_player_stats_pitching_gin`: JSONB queries on pitching stats (GIN index)

**Validation Rules**:
- stat_date: Cannot be in the future
- Either batting_stats or pitching_stats must be non-empty
- If is_season_total = true, opponent must be NULL

**Constraints**:
- `unique_player_game`: UNIQUE (player_id, stat_date, opponent) WHERE is_season_total = false
- `unique_player_season`: UNIQUE (player_id, stat_date) WHERE is_season_total = true

**Relationships**:
- `player`: Many-to-one with Player

---

### Lineup

**Purpose**: User-created fantasy baseball lineup.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique lineup identifier |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Lineup owner |
| name | VARCHAR(100) | NOT NULL | User-defined lineup name |
| scoring_config_id | UUID | FOREIGN KEY (scoring_configs.id), NULLABLE | Associated scoring config |
| projected_score | DECIMAL(10,2) | DEFAULT 0.0 | Total projected score |
| actual_score | DECIMAL(10,2) | NULLABLE | Total actual score (post-game) |
| game_date | DATE | NULLABLE | Date for lineup (for daily fantasy) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |

**Indexes**:
- `idx_lineups_user_id`: Fetch user's lineups
- `idx_lineups_user_date`: Filter lineups by user and game date
- `idx_lineups_deleted_at`: Exclude soft-deleted lineups

**Validation Rules**:
- Name: Max 100 chars, non-empty
- projected_score: Must be ≥ 0
- actual_score: Must be ≥ 0 if not NULL
- scoring_config_id: Must belong to same user_id

**Constraints**:
- `valid_scoring_config`: CHECK scoring_config_id IS NULL OR user_id matches scoring_configs.user_id

**Relationships**:
- `user`: Many-to-one with User
- `scoringConfig`: Many-to-one with ScoringConfiguration (optional)
- `slots`: One-to-many with LineupSlot

---

### LineupSlot

**Purpose**: Individual slot in a flexible lineup (max 25 players). Supports research use cases like comparing all players of a specific type (e.g., all Brewers starting pitchers).

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique slot identifier |
| lineup_id | UUID | FOREIGN KEY (lineups.id), NOT NULL | Parent lineup |
| slot_order | INT | NOT NULL | Display order (1-25) |
| player_id | VARCHAR(50) | FOREIGN KEY (players.id), NULLABLE | Assigned player |
| projected_score | DECIMAL(10,2) | DEFAULT 0.0 | Player projected score |
| actual_score | DECIMAL(10,2) | NULLABLE | Player actual score (post-game) |
| locked | BOOLEAN | DEFAULT false | Prevent changes after game start |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_lineup_slots_lineup_id`: Fetch all slots for lineup
- `idx_lineup_slots_player_id`: Find lineups containing specific player

**Validation Rules**:
- slot_order: Must be between 1 and 25
- projected_score: Must be ≥ 0
- actual_score: Must be ≥ 0 if not NULL
- player_id: No duplicate players in the same lineup

**Constraints**:
- `unique_lineup_slot_order`: UNIQUE (lineup_id, slot_order)
- `unique_lineup_player`: UNIQUE (lineup_id, player_id) WHERE player_id IS NOT NULL
- `max_25_slots`: Application-level validation to prevent more than 25 slots per lineup

**Relationships**:
- `lineup`: Many-to-one with Lineup
- `player`: Many-to-one with Player (optional)

**Notes**:
- Player position is NOT stored in LineupSlot; it's retrieved from the Player entity for display
- No position-based slot enforcement allows flexible lineup composition (all OFs, all SPs, etc.)
- UI disables "Add Player" when lineup reaches 25 players (prevention over validation)
- Backend still validates max 25 and no duplicates for security (defense in depth)

---

### AuditLog

**Purpose**: Audit trail for security events and data modifications.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log entry identifier |
| user_id | UUID | FOREIGN KEY (users.id), NULLABLE | Associated user (null for system) |
| action | VARCHAR(50) | NOT NULL | Action type (login, logout, update, delete, etc.) |
| entity_type | VARCHAR(50) | NULLABLE | Affected entity type |
| entity_id | VARCHAR(255) | NULLABLE | Affected entity ID |
| ip_address | VARCHAR(45) | NOT NULL | Client IP address (IPv6 max length) |
| user_agent | TEXT | NULLABLE | Client user agent string |
| metadata | JSONB | DEFAULT '{}' | Additional context |
| created_at | TIMESTAMP | NOT NULL | Event timestamp |

**Indexes**:
- `idx_audit_logs_user_created`: User activity history
- `idx_audit_logs_action_created`: Filter by action type and time range
- `idx_audit_logs_entity`: Find all actions on specific entity

**Validation Rules**:
- Action: Must be one of (login, logout, register, update_profile, delete_account, create, update, delete, view)
- IP address: Valid IPv4 or IPv6 format
- created_at: Cannot be in the future

**Retention Policy**:
- Keep for 90 days minimum (compliance requirement)
- Archive after 1 year to cold storage

**Relationships**:
- `user`: Many-to-one with User (optional, NULL for anonymous actions)

---

### RefreshToken

**Purpose**: JWT refresh token storage for secure session management.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique token identifier |
| user_id | UUID | FOREIGN KEY (users.id), NOT NULL | Token owner |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Refresh token (UUID) |
| expires_at | TIMESTAMP | NOT NULL | Token expiration timestamp |
| revoked | BOOLEAN | DEFAULT false | Manual revocation flag |
| created_at | TIMESTAMP | NOT NULL | Token creation timestamp |
| last_used_at | TIMESTAMP | NULLABLE | Last token usage timestamp |

**Indexes**:
- `idx_refresh_tokens_token`: Token lookup during refresh
- `idx_refresh_tokens_user_id`: User's active tokens
- `idx_refresh_tokens_expires_at`: Cleanup expired tokens

**Validation Rules**:
- Token: Must be UUID v4 format
- expires_at: Must be in the future at creation
- Revoke all tokens on password change or account deletion

**Cleanup Strategy**:
- Daily cron job deletes tokens where expires_at < NOW() - 7 days

**Relationships**:
- `user`: Many-to-one with User

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                        String              @id @default(uuid())
  email                     String              @unique @db.VarChar(255)
  passwordHash              String              @map("password_hash") @db.VarChar(60)
  emailVerified             Boolean             @default(false) @map("email_verified")
  emailVerificationToken    String?             @map("email_verification_token") @db.VarChar(255)
  mfaEnabled                Boolean             @default(false) @map("mfa_enabled")
  mfaSecret                 String?             @map("mfa_secret") @db.VarChar(255)
  privacySettings           Json                @default("{}") @map("privacy_settings")
  createdAt                 DateTime            @default(now()) @map("created_at")
  updatedAt                 DateTime            @updatedAt @map("updated_at")
  lastLoginAt               DateTime?           @map("last_login_at")
  deletedAt                 DateTime?           @map("deleted_at")

  scoringConfigs            ScoringConfiguration[]
  lineups                   Lineup[]
  auditLogs                 AuditLog[]
  refreshTokens             RefreshToken[]

  @@index([email], name: "idx_users_email")
  @@index([emailVerified], name: "idx_users_email_verified")
  @@index([deletedAt], name: "idx_users_deleted_at")
  @@map("users")
}

model ScoringConfiguration {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  name       String   @db.VarChar(100)
  categories Json
  isActive   Boolean  @default(false) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lineups    Lineup[]

  @@unique([userId, isActive], name: "unique_active_config")
  @@index([userId], name: "idx_scoring_configs_user_id")
  @@index([userId, isActive], name: "idx_scoring_configs_user_active")
  @@map("scoring_configurations")
}

model Player {
  id            String              @id @db.VarChar(50)
  name          String              @db.VarChar(255)
  team          String              @db.VarChar(10)
  position      String              @db.VarChar(20)
  jerseyNumber  Int?                @map("jersey_number")
  active        Boolean             @default(true)
  season        Int
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  syncedAt      DateTime            @default(now()) @map("synced_at")

  statistics    PlayerStatistic[]
  lineupSlots   LineupSlot[]

  @@index([team, position], name: "idx_players_team_position")
  @@index([active, season], name: "idx_players_active_season")
  @@index([syncedAt], name: "idx_players_synced_at")
  @@map("players")
}

model PlayerStatistic {
  id            String   @id @default(uuid())
  playerId      String   @map("player_id") @db.VarChar(50)
  statDate      DateTime @map("stat_date") @db.Date
  opponent      String?  @db.VarChar(10)
  isSeasonTotal Boolean  @default(false) @map("is_season_total")
  battingStats  Json     @default("{}") @map("batting_stats")
  pitchingStats Json     @default("{}") @map("pitching_stats")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  player        Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([playerId, statDate, opponent], name: "unique_player_game")
  @@index([playerId, statDate], name: "idx_player_stats_player_date")
  @@index([isSeasonTotal], name: "idx_player_stats_season_total")
  @@map("player_statistics")
}

model Lineup {
  id                String                    @id @default(uuid())
  userId            String                    @map("user_id")
  name              String                    @db.VarChar(100)
  scoringConfigId   String?                   @map("scoring_config_id")
  projectedScore    Decimal                   @default(0.0) @map("projected_score") @db.Decimal(10, 2)
  actualScore       Decimal?                  @map("actual_score") @db.Decimal(10, 2)
  gameDate          DateTime?                 @map("game_date") @db.Date
  createdAt         DateTime                  @default(now()) @map("created_at")
  updatedAt         DateTime                  @updatedAt @map("updated_at")
  deletedAt         DateTime?                 @map("deleted_at")

  user              User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  scoringConfig     ScoringConfiguration?     @relation(fields: [scoringConfigId], references: [id], onDelete: SetNull)
  slots             LineupSlot[]

  @@index([userId], name: "idx_lineups_user_id")
  @@index([userId, gameDate], name: "idx_lineups_user_date")
  @@index([deletedAt], name: "idx_lineups_deleted_at")
  @@map("lineups")
}

model LineupSlot {
  id             String   @id @default(uuid())
  lineupId       String   @map("lineup_id")
  slotOrder      Int      @map("slot_order")
  playerId       String?  @map("player_id") @db.VarChar(50)
  projectedScore Decimal  @default(0.0) @map("projected_score") @db.Decimal(10, 2)
  actualScore    Decimal? @map("actual_score") @db.Decimal(10, 2)
  locked         Boolean  @default(false)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  lineup         Lineup   @relation(fields: [lineupId], references: [id], onDelete: Cascade)
  player         Player?  @relation(fields: [playerId], references: [id], onDelete: SetNull)

  @@unique([lineupId, slotOrder], name: "unique_lineup_slot_order")
  @@unique([lineupId, playerId], name: "unique_lineup_player")
  @@index([lineupId], name: "idx_lineup_slots_lineup_id")
  @@index([playerId], name: "idx_lineup_slots_player_id")
  @@map("lineup_slots")
}

model AuditLog {
  id         String    @id @default(uuid())
  userId     String?   @map("user_id")
  action     String    @db.VarChar(50)
  entityType String?   @map("entity_type") @db.VarChar(50)
  entityId   String?   @map("entity_id") @db.VarChar(255)
  ipAddress  String    @map("ip_address") @db.VarChar(45)
  userAgent  String?   @map("user_agent") @db.Text
  metadata   Json      @default("{}")
  createdAt  DateTime  @default(now()) @map("created_at")

  user       User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt], name: "idx_audit_logs_user_created")
  @@index([action, createdAt], name: "idx_audit_logs_action_created")
  @@index([entityType, entityId], name: "idx_audit_logs_entity")
  @@map("audit_logs")
}

model RefreshToken {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  token      String    @unique @db.VarChar(255)
  expiresAt  DateTime  @map("expires_at")
  revoked    Boolean   @default(false)
  createdAt  DateTime  @default(now()) @map("created_at")
  lastUsedAt DateTime? @map("last_used_at")

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token], name: "idx_refresh_tokens_token")
  @@index([userId], name: "idx_refresh_tokens_user_id")
  @@index([expiresAt], name: "idx_refresh_tokens_expires_at")
  @@map("refresh_tokens")
}
```

## Data Integrity Rules

### Cascade Deletion Rules

1. **User deleted** → Cascade delete:
   - All ScoringConfigurations
   - All Lineups (which cascade to LineupSlots)
   - All RefreshTokens
   - Set NULL for AuditLogs (preserve audit trail)

2. **ScoringConfiguration deleted** → Set NULL:
   - Lineup.scoringConfigId (lineups revert to standard scoring)

3. **Player deleted** → Set NULL:
   - LineupSlot.playerId (preserve lineup structure, mark slot as empty)

4. **Lineup deleted** → Cascade delete:
   - All LineupSlots

### Soft Delete Implementation

**Affected Entities**: User, Lineup

**Behavior**:
- Set `deleted_at = NOW()` instead of hard delete
- All queries filter `WHERE deleted_at IS NULL`
- 30-day grace period before permanent deletion (compliance)
- Background job hard-deletes after grace period

## Migration Strategy

### Initial Migration

1. Create tables in dependency order: User → ScoringConfiguration/Player → PlayerStatistic → Lineup → LineupSlot → AuditLog/RefreshToken
2. Create indexes after table creation for performance
3. Seed players table with current MLB roster (mlb-stats-api)

### Data Seeding

**Development Environment**:
- 10 test users with varied scoring configs
- Current season MLB players (~1000 players)
- Sample lineups for each user
- Historical stats for past 7 days

**Production Environment**:
- No user seeding (accounts created via registration)
- MLB player sync on deployment
- Empty lineups/scoring configs initially

## Performance Considerations

### Query Optimization

**Most Frequent Queries**:
1. Player search with filters (team, position): Use composite index
2. User's active scoring config: Use filtered index
3. Lineup with slots and players: Use LEFT JOIN with selective fields
4. Audit log for user: Use descending index on created_at

**Query Examples**:
```sql
-- Optimized player search
SELECT * FROM players
WHERE team = 'NYY' AND position IN ('SS', '2B')
  AND active = true AND season = 2025
ORDER BY name;
-- Uses: idx_players_team_position

-- Optimized lineup fetch with slots
SELECT l.*, ls.*, p.name, p.position
FROM lineups l
LEFT JOIN lineup_slots ls ON l.id = ls.lineup_id
LEFT JOIN players p ON ls.player_id = p.id
WHERE l.user_id = $1 AND l.deleted_at IS NULL
ORDER BY l.updated_at DESC;
-- Uses: idx_lineups_user_id
```

### Partitioning Strategy (Future)

**PlayerStatistic Table**:
- Partition by `stat_date` (monthly partitions)
- Improves query performance for date range filters
- Simplifies data retention (drop old partitions)

**AuditLog Table**:
- Partition by `created_at` (monthly partitions)
- Retention policy: 90 days hot, 1 year archive

## Backup and Recovery

**Backup Strategy**:
- Automated daily snapshots at 2 AM UTC
- Point-in-time recovery (WAL archiving)
- Cross-region replication for disaster recovery
- 7-day retention for daily snapshots
- 30-day retention for weekly snapshots

**Recovery Scenarios**:
- **Single table corruption**: Restore from snapshot, replay WAL to current
- **Database failure**: Promote read replica, redirect traffic
- **Data loss (user error)**: Point-in-time recovery to before error

## Summary

The data model supports all functional requirements:
- ✅ User account management with MFA (FR-001-007)
- ✅ Custom scoring configurations with JSONB flexibility (FR-008-013)
- ✅ Player research with efficient indexing (FR-014-020)
- ✅ Lineup management with validation (FR-021-027)
- ✅ Audit logging for compliance (FR-007, SC-011)
- ✅ Performance targets via proper indexing (SC-003, SC-009)

The schema is normalized to 3NF with strategic denormalization (projected_score, actual_score) for performance. All entities support soft deletion where appropriate and maintain audit trails for compliance.
