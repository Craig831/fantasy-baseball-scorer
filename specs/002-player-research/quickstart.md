# Quickstart: Player Research Integration Scenarios

**Feature**: Player Research
**Branch**: feature/player-research
**Date**: 2025-11-09 (Updated)

## Overview

This document provides end-to-end integration scenarios for the player research feature with updated UI (horizontal filter panel with Apply/Clear buttons) and dynamic column display based on scoring configuration. Each scenario shows API calls, data flow, and expected outcomes.

## Prerequisites

- User authenticated with valid JWT token
- At least one scoring configuration created (for scoring scenarios)
- Player data populated in database from MLB-StatsAPI

## Scenario 1: User Applies Filters and Views Scored Players

**User Goal**: Search for active pitchers with scores based on my custom scoring configuration using the horizontal filter panel with explicit Apply button.

### Steps

1. **User navigates to Player Research page**
   - Frontend loads with default filter state:
     - Statistic Type: "Batting" (toggle)
     - Positions: [] (all positions)
     - Season: 2024 (current year)
     - Status: "Active"
     - Date Range: null (season-to-date)
   - Apply button: **disabled** (no changes made)
   - Clear button: **disabled** (default filters applied)
   - Player listing shows all active batters

2. **User modifies filters** (filter panel line-by-line):
   - **Line 1**: Clicks "Pitching" toggle (statistic type changes)
   - **Line 1**: Selects Season: "2024"
   - **Line 1**: Status remains "Active"
   - **Line 2**: Checks position checkbox: "Pitcher"
   - Apply button: **enabled** (pending changes detected)
   - Clear button: **disabled** (filters not yet applied)
   - Player listing: **still showing batters** (filters not yet applied)

3. **User clicks Apply button**:
   - Apply button becomes **disabled**
   - Clear button becomes **enabled**
   - Frontend makes API request:

```http
GET /api/players?statisticType=pitching&positions=Pitcher&season=2024&status=active&page=1&limit=50&sortBy=totalPoints&sortOrder=desc
Authorization: Bearer {jwt_token}
```

4. **Backend processes request**:
   - Validates JWT token → extracts userId
   - Retrieves user's active scoring configuration
   - Queries Player table with filters:
     ```sql
     WHERE position = 'Pitcher' AND status = 'active'
     JOIN PlayerStatistic WHERE season = 2024 AND statisticType = 'pitching'
     ```
   - Calculates totalPoints and pointsPerGame using scoring configuration
   - Determines which statistics columns to return (only stats with points in config)
   - Returns paginated results

5. **Backend response**:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "mlbPlayerId": 543037,
      "name": "Cole, Gerrit",
      "position": "Pitcher",
      "teamAbbr": "NYY",
      "status": "active",
      "totalPoints": 287.5,
      "pointsPerGame": 8.98,
      "statistics": {
        "gp": 32,
        "gs": 32,
        "w": 16,
        "l": 9,
        "s": 0,
        "er": 67,
        "bb": 48,
        "k": 234
      },
      "lastUpdated": "2024-11-09T15:00:00Z"
    },
    {
      "id": "e5f6g7h8-...",
      "mlbPlayerId": 669373,
      "name": "Rodon, Carlos",
      "position": "Pitcher",
      "teamAbbr": "NYY",
      "status": "active",
      "totalPoints": 195.3,
      "pointsPerGame": 6.98,
      "statistics": {
        "gp": 28,
        "gs": 28,
        "w": 11,
        "l": 10,
        "s": 0,
        "er": 71,
        "bb": 61,
        "k": 178
      },
      "lastUpdated": "2024-11-09T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 145,
    "totalPages": 3
  },
  "meta": {
    "lastUpdated": "2024-11-09T15:00:00Z",
    "scoringConfigName": "My Custom League Rules"
  }
}
```

6. **Frontend displays results**:
   - Renders table with dynamic columns based on scoring config:
     - **Base columns (always shown)**: Player Name, Pos, Team, PTS, PPG
     - **Stat columns (only if in scoring config)**: GP, GS, W, L, S, ER, BB, K
     - Note: "H" (holds) column NOT shown because scoring config doesn't include holds
   - Player names formatted: "Lastname, Firstname"
   - Team abbreviations: "NYY" instead of "New York Yankees"
   - Sorted by totalPoints descending
   - Apply button: **disabled** (no pending changes)
   - Clear button: **enabled** (filters applied)

7. **User clicks Clear button**:
   - All filters reset to defaults (batting, all positions, current season, active, no date range)
   - Apply button: **disabled** (defaults applied immediately)
   - Clear button: **disabled** (back to default state)
   - Player listing refreshes with default filters

### Success Criteria

- ✅ Results returned in < 5 seconds
- ✅ Only pitchers displayed after Apply clicked
- ✅ Filters don't execute until Apply button clicked
- ✅ Apply button only enabled when changes pending
- ✅ Clear button only enabled when non-default filters applied
- ✅ Scores calculated as totalPoints and pointsPerGame
- ✅ Columns dynamically displayed based on scoring configuration
- ✅ Team abbreviations shown (NYY, LAA, etc.)

---

## Scenario 2: User Saves and Reuses a Search

**User Goal**: Save my current filter combination so I can quickly access "2024 Pitchers" again later.

### Steps

1. **User has filters applied** (from Scenario 1)
   - Statistic Type: Pitching
   - Positions: [Pitcher]
   - Season: 2024
   - Status: Active
   - Date Range: null (season-to-date)

2. **User clicks "Save Search" button**
   - Modal opens prompting for search name
   - User enters: "2024 Pitchers"

3. **Frontend makes API request**:

```http
POST /api/saved-searches
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "2024 Pitchers",
  "filters": {
    "filterVersion": 2,
    "statisticType": "pitching",
    "positions": ["Pitcher"],
    "season": 2024,
    "status": "active",
    "dateRange": {
      "from": null,
      "to": null
    },
    "sortBy": "totalPoints",
    "sortOrder": "desc"
  },
  "scoringConfigurationId": "config-uuid-123"
}
```

4. **Backend processes request**:
   - Validates JWT token → extracts userId
   - Validates filter structure
   - Checks unique constraint (userId, name)
   - Validates scoringConfigurationId exists
   - Creates SavedSearch record
   - Creates audit log entry

5. **Backend response**:

```json
{
  "data": {
    "id": "search-uuid-456",
    "name": "2024 Pitchers",
    "filters": {
      "filterVersion": 2,
      "statisticType": "pitching",
      "positions": ["Pitcher"],
      "season": 2024,
      "status": "active",
      "dateRange": {
        "from": null,
        "to": null
      },
      "sortBy": "totalPoints",
      "sortOrder": "desc"
    },
    "scoringConfigurationId": "config-uuid-123",
    "scoringConfigurationName": "My Custom League Rules",
    "createdAt": "2024-11-09T16:30:00Z",
    "updatedAt": "2024-11-09T16:30:00Z"
  }
}
```

6. **User navigates away and returns later**
   - Opens Player Research page
   - Sees "Saved Searches" dropdown with "2024 Pitchers"
   - Selects "2024 Pitchers" from dropdown

7. **Frontend loads saved search**:
   - Applies filters to filter panel (populates statistic type toggle, position checkboxes, season, status)
   - Automatically clicks Apply (executes search)
   - Makes API request:

```http
GET /api/players?statisticType=pitching&positions=Pitcher&season=2024&status=active&scoringConfigId=config-uuid-123&sortBy=totalPoints&sortOrder=desc&page=1&limit=50
Authorization: Bearer {jwt_token}
```

8. **Results displayed instantly** (same as Scenario 1)
   - Filter panel shows applied filters
   - Apply button: **disabled** (no pending changes)
   - Clear button: **enabled** (non-default filters applied)

### Success Criteria

- ✅ Search saved successfully with unique name
- ✅ Saved search persists across sessions
- ✅ Loading saved search applies all filters instantly
- ✅ Saved search loads in < 3 seconds

---

## Scenario 3: User Changes Scoring Configuration and Sees Scores and Columns Update

**User Goal**: Compare how different scoring rules affect player rankings and see which stats are valued in each configuration.

### Steps

1. **User has players displayed** (from Scenario 1)
   - Currently using "My Custom League Rules" config
   - Gerrit Cole has totalPoints: 287.5, pointsPerGame: 8.98
   - Columns shown: Player, Pos, Team, PTS, PPG, GP, GS, W, L, S, ER, BB, K
   - Note: "H" (holds) column NOT shown (not in this config)

2. **User opens scoring configuration dropdown**
   - Frontend fetches user's scoring configurations:

```http
GET /api/scoring-configurations
Authorization: Bearer {jwt_token}
```

3. **User selects different configuration**: "Standard Points League with Holds"
   - This config includes points for Holds (H), but removes Saves (S)

4. **Frontend re-fetches players with new config**:

```http
GET /api/players?statisticType=pitching&positions=Pitcher&season=2024&status=active&scoringConfigId=config-uuid-789&page=1&limit=50&sortBy=totalPoints&sortOrder=desc
Authorization: Bearer {jwt_token}
```

5. **Backend recalculates scores**:
   - Uses new scoring configuration rules
   - Applies different point values to statistics
   - Determines which statistics to return (now includes H, excludes S)
   - Returns updated results

6. **Backend response**:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "mlbPlayerId": 543037,
      "name": "Cole, Gerrit",
      "position": "Pitcher",
      "teamAbbr": "NYY",
      "status": "active",
      "totalPoints": 423.8,
      "pointsPerGame": 13.24,
      "statistics": {
        "gp": 32,
        "gs": 32,
        "w": 16,
        "l": 9,
        "h": 2,
        "er": 67,
        "bb": 48,
        "k": 234
      },
      "lastUpdated": "2024-11-09T15:00:00Z"
    },
    ...
  ],
  "meta": {
    "lastUpdated": "2024-11-09T15:00:00Z",
    "scoringConfigName": "Standard Points League with Holds"
  }
}
```

7. **Frontend updates display**:
   - **Scores recalculated**: totalPoints and pointsPerGame updated
   - **Columns dynamically change**:
     - New columns: Player, Pos, Team, PTS, PPG, GP, GS, W, L, **H** (added), ER, BB, K
     - **S** (saves) column REMOVED (not in new config)
   - Player rankings may change based on new scores
   - Configuration name updated in UI: "Standard Points League with Holds"
   - ARIA live region announces: "Table updated: showing 12 columns. Scores recalculated."
   - Visual indicator shows scores have changed

8. **User can click on player's totalPoints to see breakdown**:
   - Shows which statistics contributed to new score
   - Example: "W: 16 × 5pts = 80pts, K: 234 × 1pt = 234pts, H: 2 × 3pts = 6pts, ..."

### Success Criteria

- ✅ Scores recalculate within 2 seconds
- ✅ New configuration name displayed
- ✅ Player rankings update based on new scores
- ✅ **Columns dynamically adjust** (H added, S removed)
- ✅ Statistics remain unchanged (only scores and visible columns change)
- ✅ Accessibility announcement for column/score changes

---

## Scenario 4: Background Job Refreshes Player Statistics

**User Goal**: Ensure player statistics are up-to-date throughout the day.

### Steps

1. **Scheduled job triggers** (hourly during season)
   - NestJS @Cron decorator fires at :00 each hour
   - Job: `PlayerStatsRefreshService.refreshStatistics()`

2. **Job fetches active players**:

```sql
SELECT id, mlbPlayerId FROM Player WHERE status = 'active'
```

3. **For each player, fetch updated stats from MLB API**:

```http
GET https://statsapi.mlb.com/api/v1/people/{mlbPlayerId}/stats?stats=season&season=2024
```

4. **MLB API response**:

```json
{
  "stats": [{
    "splits": [{
      "season": "2024",
      "stat": {
        "gamesStarted": 33,
        "wins": 17,
        "era": "2.88",
        "strikeouts": 245,
        "inningsPitched": "210.0"
      }
    }]
  }]
}
```

5. **Job updates database**:
   - Upsert PlayerStatistic record for current season
   - Update Player.lastUpdated timestamp
   - Log successful refresh

```sql
UPDATE Player SET lastUpdated = NOW() WHERE id = ...;

INSERT INTO PlayerStatistic (playerId, season, statisticType, statistics, dateFrom, dateTo, ...)
VALUES (...)
ON CONFLICT (playerId, season, statisticType, dateFrom, dateTo)
DO UPDATE SET statistics = EXCLUDED.statistics, updatedAt = NOW();
```

6. **Job completion**:
   - Logs: "Refreshed statistics for 1,200 players in 45 seconds"
   - Metrics recorded for monitoring

7. **User sees updated data**:
   - Next time user searches, sees latest statistics
   - `lastUpdated` timestamp shows current hour
   - Scores reflect updated statistics

### Success Criteria

- ✅ Statistics refreshed hourly during active season
- ✅ All active players updated within 60 seconds
- ✅ Failed API calls retried with exponential backoff
- ✅ Errors logged but job completes
- ✅ User sees "Last updated" timestamp within past hour

---

## Error Scenarios

### Scenario 5: User Searches with No Active Scoring Configuration

**User Goal**: View players without scores (raw statistics only).

**Steps**:
1. User has no active scoring configuration set
2. User applies filters and searches
3. Backend returns players with `score: null`
4. Frontend displays message: "Select a scoring configuration to see calculated scores"
5. Players sortable by statistics, not by score

**Success Criteria**:
- ✅ Search completes successfully
- ✅ Players displayed with statistics
- ✅ Clear messaging about missing scores

### Scenario 6: User Filters Return Zero Results

**User Goal**: Understand why no players match criteria.

**Steps**:
1. User applies very restrictive filters (e.g., "Catchers on non-existent team")
2. Backend returns empty array
3. Frontend displays: "No players match your criteria. Try adjusting your filters."
4. Suggests removing one filter at a time

**Success Criteria**:
- ✅ Empty state clearly communicated
- ✅ Helpful guidance provided
- ✅ Filters remain applied (user can adjust)

### Scenario 7: MLB API Temporarily Unavailable

**User Goal**: Access player data even when external API is down.

**Steps**:
1. Background job attempts to refresh statistics
2. MLB API returns 503 Service Unavailable
3. Job implements exponential backoff (retry after 1min, 2min, 4min)
4. If still failing, job completes with error log
5. User searches see cached data (> 1 hour old)
6. Frontend displays banner: "Player statistics last updated 3 hours ago"

**Success Criteria**:
- ✅ Users can still search with cached data
- ✅ Clear indication data may be stale
- ✅ Automatic recovery when API returns

---

## Integration Points

### With Existing Features

1. **Authentication** (Feature 001):
   - All player research endpoints require JWT authentication
   - UserId extracted from JWT for user-scoped operations

2. **Scoring Configurations** (Feature 002):
   - Score calculations use ScoringConfiguration entities
   - SavedSearch can reference scoringConfigurationId
   - If no active config, scores are null

### With External Systems

1. **MLB-StatsAPI**:
   - Background job fetches player data hourly
   - Direct REST API calls (no authentication required)
   - Response data mapped to PlayerStatistic JSONB

2. **Database (PostgreSQL)**:
   - Player and PlayerStatistic tables store cached data
   - SavedSearch table persists user preferences
   - Complex joins for filtering and scoring

---

## Testing Recommendations

1. **Unit Tests**:
   - Score calculation logic
   - Filter query builders
   - MLB API response parsers

2. **Integration Tests**:
   - API endpoints with various filter combinations
   - Saved search CRUD operations
   - Score recalculation with different configs

3. **E2E Tests**:
   - Complete user workflows (Scenarios 1-3)
   - Error handling scenarios (5-7)
   - Background job execution

4. **Performance Tests**:
   - Large result sets (1000+ players)
   - Concurrent user searches
   - Score calculation benchmarks

---

## Deployment Considerations

1. **Initial Data Load**:
   - Run background job manually to populate Player and PlayerStatistic tables
   - Verify ~1,200 active players loaded
   - Confirm statistics available for current season

2. **Monitoring**:
   - Track background job execution times
   - Monitor MLB API error rates
   - Alert on stale data (> 2 hours old during season)

3. **Rollback Plan**:
   - If player research breaks, feature is behind authentication
   - Does not affect existing auth or scoring config features
   - Can disable background job without affecting cached data

---

## Summary

These scenarios demonstrate:
- End-to-end player search with filtering and scoring
- Saved search persistence and reuse
- Dynamic score recalculation with different configurations
- Background data refresh from external API
- Error handling and graceful degradation

All scenarios align with feature requirements and performance goals defined in spec.md.
