# Research: Player Research Feature

**Date**: 2025-11-09 (Updated)
**Feature**: Player Research
**Branch**: 002-player-research

## Overview

This document captures research findings for implementing player research functionality with MLB player data integration, performance optimization for score calculations, saved search persistence, and the updated UI requirements for horizontal filter panel with explicit apply/clear logic and dynamic column display based on scoring configuration.

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

## 2. Accessibility Compliance (WCAG 2.1 AA)

### Decision

Implement WCAG 2.1 AA compliant filter panel and data table using **React ARIA patterns** and **semantic HTML** with the following approach:

- **Filter Panel Structure**: Use `<fieldset>` and `<legend>` for grouping filters by line, native form controls with proper labels
- **Toggle Control (Statistic Type)**: Implement as radio button group with `role="radiogroup"` and `aria-checked` states
- **Button States**: Use `aria-disabled="true"` with visual styling that meets 3:1 contrast ratio minimum for disabled state
- **Dynamic Table**: Use semantic `<table>` with `<th scope="col">`, ARIA live regions (`aria-live="polite"`) for column changes
- **Keyboard Navigation**: Full tab order, Enter/Space for button activation, Arrow keys for radio group navigation
- **Focus Indicators**: Visible 2px outline with 4.5:1 contrast ratio, never removed programmatically

### Rationale

- **Constitution Requirement**: Project constitution mandates WCAG compliance (Section I: Accessibility first)
- **Legal Compliance**: WCAG 2.1 AA is required for ADA Section 508 compliance
- **Native Controls**: HTML native elements (radio, checkbox, button) provide built-in accessibility vs. custom div-based controls
- **React ARIA**: Adobe's React ARIA library provides tested, accessible primitives for complex interactions
- **Semantic Tables**: Screen readers understand native `<table>` structure; `<th scope="col">` properly announces column headers

### Implementation Guidelines

**Color Contrast**:
- Text: 4.5:1 minimum (body text)
- UI Components: 3:1 minimum (buttons, form controls)
- Disabled buttons: 3:1 minimum for border/background differentiation

**Touch Targets** (mobile-first requirement):
- Minimum 44x44px for all interactive elements
- Applies to filter checkboxes, Apply/Clear buttons, column sort controls

**Form Control Labels**:
- All inputs must have associated `<label>` or `aria-label`
- Toggle control: `aria-labelledby` linking to group label
- Position checkboxes: Each checkbox has visible label text

**Dynamic Content Announcements**:
- Apply filters: `aria-live="polite"` region announces "Filters applied: {count} players found"
- Column changes: `aria-live="polite"` announces "Table updated: showing {count} columns"
- Score recalculation: `aria-live="polite"` announces "Scores recalculated"

**Keyboard Patterns**:
- Tab: Navigate between filter groups, buttons, table controls
- Arrow keys: Navigate within radio group (statistic type toggle)
- Space/Enter: Activate buttons, toggle checkboxes
- Escape: Clear focus from current element

**Testing Requirements**:
- Manual testing with NVDA (Windows) and VoiceOver (Mac)
- Automated testing with axe-core
- Keyboard-only navigation testing
- Mobile screen reader testing (TalkBack, VoiceOver iOS)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Custom toggle with div + onClick** | Requires extensive ARIA work, error-prone, doesn't convey state to assistive tech |
| **Material-UI/Chakra alone** | Component libraries vary in accessibility quality; React ARIA provides verified primitives |
| **WCAG 2.0 A/AA** | WCAG 2.1 includes mobile improvements (orientation, touch target size) critical for mobile-first design |
| **Skip accessibility testing** | Constitution violation, legal liability, ethical requirement |

---

## 3. Filter State Management (Pending vs. Applied)

### Decision

Implement filter state management using **React state with pending/applied pattern**:

```typescript
type FilterState = {
  pending: FilterCriteria;     // Current form values (not yet applied)
  applied: FilterCriteria;     // Last applied filters (drives API query)
  isDirty: boolean;            // True if pending !== applied
};

type FilterCriteria = {
  statisticType: 'batting' | 'pitching';
  positions: string[];         // Array of selected positions
  season: number;              // Year (e.g., 2024)
  status: string;              // 'active', 'injured', etc.
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
};
```

**Button Enabling Logic**:
- `applyButtonEnabled = isDirty && isValid(pending)`
- `clearButtonEnabled = !isEqual(applied, defaultFilters)`

**URL Synchronization**:
- Serialize `applied` filters to URL query params on Apply click
- Parse URL params on page load to restore filter state
- Enables shareable/bookmarkable searches

### Rationale

- **Spec Requirements**: FR-005 (Apply enabled when changes exist), FR-006 (Clear enabled when filters applied), FR-014 (Apply-to-execute pattern)
- **User Control**: Prevents accidental filtering on each keystroke, gives explicit control via Apply button
- **isDirty Flag**: Simplifies button logic, clearly signals unsaved changes to user
- **Immutability**: Using separate pending/applied states prevents accidental mutations
- **URL State**: Enables browser back/forward, bookmarking, sharing searches

### Implementation Guidelines

**Default Filters**:
```typescript
const defaultFilters: FilterCriteria = {
  statisticType: 'batting',
  positions: [],              // Empty = all positions
  season: new Date().getFullYear(),
  status: 'active',
  dateRange: { from: null, to: null }  // null = season-to-date
};
```

**Dirty Detection**:
- Use `lodash.isEqual` for deep equality comparison
- Compare `pending` vs. `applied` to set `isDirty`
- Re-compute on every filter change

**Validation Rules**:
- Date range: `from` must be ≤ `to` if both specified
- Season: Must be valid MLB season (1876-present)
- At least one position OR positions array empty (all positions)

**Clear Behavior**:
- Resets `pending` and `applied` to `defaultFilters`
- Does NOT clear to empty state (season defaults to current, status to active)

**URL Encoding**:
```typescript
const params = new URLSearchParams({
  type: filters.statisticType,
  positions: filters.positions.join(','),
  season: filters.season.toString(),
  status: filters.status,
  from: filters.dateRange.from?.toISOString() || '',
  to: filters.dateRange.to?.toISOString() || ''
});
history.pushState(null, '', `?${params.toString()}`);
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Auto-apply on change** | Violates spec (explicit Apply button required), expensive queries on each keystroke |
| **Single state object** | Can't distinguish pending vs. applied, breaks button enabling logic |
| **Redux/Zustand** | Overkill for feature-scoped state, adds complexity and bundle size |
| **Form library (React Hook Form)** | Unnecessary dependency for simple filter form |
| **Local Storage for state** | URL params better for shareability, more transparent to users |

---

## 4. Dynamic Column Display

### Decision

Implement **dynamic column rendering** using a configuration resolver that determines visible columns based on:

1. **Player position type** (batter vs. pitcher) from `statisticType` filter
2. **Active scoring configuration** (which stats have non-zero point values)

**Column Resolver Logic**:
```typescript
function resolveColumns(
  statisticType: 'batting' | 'pitching',
  scoringConfig: ScoringConfig
): Column[] {
  // Base columns always shown
  const baseColumns: Column[] = [
    { key: 'playerName', label: 'Player', sortable: true, sticky: true },
    { key: 'position', label: 'Pos', sortable: true, sticky: true },
    { key: 'teamAbbr', label: 'Team', sortable: true, sticky: true },
    { key: 'totalPoints', label: 'PTS', sortable: true, sticky: false },
    { key: 'pointsPerGame', label: 'PPG', sortable: true, sticky: false },
  ];

  // Stat columns filtered by scoring config
  const allStatColumns = statisticType === 'batting'
    ? BATTER_STAT_COLUMNS
    : PITCHER_STAT_COLUMNS;

  const scoredStatColumns = allStatColumns.filter(col =>
    scoringConfig.hasPoints(col.statKey)
  );

  return [...baseColumns, ...scoredStatColumns];
}
```

**Stat Column Definitions**:
```typescript
const BATTER_STAT_COLUMNS: Column[] = [
  { key: 'gp', label: 'GP', statKey: 'gamesPlayed', sortable: true },
  { key: 'ab', label: 'AB', statKey: 'atBats', sortable: true },
  { key: 'h', label: 'H', statKey: 'hits', sortable: true },
  { key: '2b', label: '2B', statKey: 'doubles', sortable: true },
  { key: '3b', label: '3B', statKey: 'triples', sortable: true },
  { key: 'hr', label: 'HR', statKey: 'homeRuns', sortable: true },
  { key: 'r', label: 'R', statKey: 'runs', sortable: true },
  { key: 'rbi', label: 'RBI', statKey: 'runsBattedIn', sortable: true },
  { key: 'bb', label: 'BB', statKey: 'baseOnBalls', sortable: true },
  { key: 'k', label: 'K', statKey: 'strikeOuts', sortable: true },
  { key: 'sb', label: 'SB', statKey: 'stolenBases', sortable: true },
  { key: 'cs', label: 'CS', statKey: 'caughtStealing', sortable: true },
];

const PITCHER_STAT_COLUMNS: Column[] = [
  { key: 'gp', label: 'GP', statKey: 'gamesPlayed', sortable: true },
  { key: 'gs', label: 'GS', statKey: 'gamesStarted', sortable: true },
  { key: 'w', label: 'W', statKey: 'wins', sortable: true },
  { key: 'l', label: 'L', statKey: 'losses', sortable: true },
  { key: 's', label: 'S', statKey: 'saves', sortable: true },
  { key: 'h', label: 'H', statKey: 'holds', sortable: true },
  { key: 'er', label: 'ER', statKey: 'earnedRuns', sortable: true },
  { key: 'bb', label: 'BB', statKey: 'baseOnBalls', sortable: true },
  { key: 'k', label: 'K', statKey: 'strikeOuts', sortable: true },
];
```

**Responsive Breakpoints**:
- **Desktop (≥1024px)**: Show all resolved columns, horizontal scroll if needed
- **Tablet (768-1023px)**: Show base columns + top 6 stat columns sorted by scoring weight
- **Mobile (<768px)**: Show base columns only; tap row to expand for full stats

**Sort State Handling**:
- If currently sorted column is removed: Reset to default sort (PTS descending)
- Otherwise: Preserve sort column and direction

### Rationale

- **FR-020 Requirement**: "only display statistical columns that are included in the active scoring configuration"
- **Reduces Visual Clutter**: Hiding unscored stats focuses attention on what matters
- **Position-Specific Stats**: Batters and pitchers have completely different stat sets
- **Responsive Design**: Mobile-first approach with progressive enhancement for larger screens
- **Scoring Philosophy**: UI reflects what the scoring system values

### Implementation Guidelines

**Sticky Columns** (horizontal scroll):
```css
.player-table th.sticky,
.player-table td.sticky {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
}
```

**Column Change Announcement** (accessibility):
```typescript
useEffect(() => {
  const columnCount = columns.length;
  const columnNames = columns.map(c => c.label).join(', ');
  announce(`Table updated: showing ${columnCount} columns: ${columnNames}`);
}, [columns]);
```

**Loading State** (prevent layout shift):
```tsx
{isRecalculating && (
  <div className="table-skeleton">
    {/* Show skeleton columns matching previous column count */}
  </div>
)}
```

**Number Formatting**:
- Whole numbers: 0 decimals (HR, RBI, K)
- Averages: 3 decimals (.310)
- Percentages: 1 decimal (31.0%)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| **Show all stats always** | Violates FR-020, creates visual clutter, confuses users about what's valued |
| **User-selectable columns** | Not in spec, adds complexity, conflicts with scoring-driven philosophy |
| **Fixed column set per position** | Ignores scoring config, doesn't adapt to user's league rules |
| **Virtual scrolling (react-window)** | Overkill for 25-50 players (SC-007), accessibility challenges |
| **Card layout on mobile** | Table better for sorting and scanning multiple players |

---

## 5. Player Statistics Caching Strategy

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

## 6. Score Calculation Performance

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

## 7. Saved Search Data Model

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

## Additional Considerations

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
1. **MLB-StatsAPI Integration**: Direct HTTP integration with hourly batch updates and granular caching strategy
2. **Accessibility Compliance**: WCAG 2.1 AA standards using React ARIA patterns and semantic HTML
3. **Filter State Management**: Pending/applied pattern with explicit Apply/Clear button logic
4. **Dynamic Column Display**: Configuration-driven columns based on position type and scoring config
5. **Player Statistics Caching**: PostgreSQL with JSONB for flexible statistics storage
6. **Score Calculation Performance**: Server-side calculation with selective caching for optimal performance
7. **Saved Search Data Model**: JSON-based filter storage with scoring configuration references

All decisions support the updated feature requirements (horizontal filter panel, dynamic columns, apply/clear logic) while maintaining performance, scalability, accessibility, and maintainability goals per project constitution.
