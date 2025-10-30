# Implementation Plan: Player Research

**Branch**: `feature/player-research` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-player-research/spec.md`

## Summary

This feature implements player research capabilities allowing users to search, filter, and analyze baseball players with calculated scores based on custom scoring configurations. The system will fetch player statistics from MLB-StatsAPI, cache them for performance, calculate scores using existing scoring configuration logic, and allow users to save frequently-used search criteria. The implementation extends the existing NestJS/PostgreSQL/React stack with new modules for player data management, statistical calculations, and saved search persistence.

## Technical Context

**Language/Version**: TypeScript 5.0+ / Node.js 20 LTS (backend), TypeScript/React 18 (frontend)
**Primary Dependencies**: NestJS 11, Prisma ORM 6, PostgreSQL 15+, MLB-StatsAPI HTTP client
**Storage**: PostgreSQL 15+ with JSONB (player statistics cache, saved searches)
**Testing**: Jest (unit), Supertest (e2e) for backend; Jest/React Testing Library for frontend
**Target Platform**: Web application (modern browsers), Node.js 20 LTS server
**Project Type**: Web (frontend + backend)
**Performance Goals**:
- Player search results < 5 seconds
- Score recalculation < 2 seconds
- Hourly statistics refresh from MLB-StatsAPI
- Support 50+ concurrent user searches
**Constraints**:
- < 200ms p95 for search/filter operations (excluding external API calls)
- MLB-StatsAPI rate limits (if any)
- 50 players per page (pagination required)
- Score calculations must align with existing ScoringConfiguration rules
**Scale/Scope**:
- ~1200 active MLB players per season
- Support filtering/scoring across multiple seasons
- Saved searches: up to 50 per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### User Experience & Interface

**Q: Is this design accessible to all users, including those with disabilities?**
✅ YES - Player research page will include:
- Semantic HTML with proper ARIA labels for filters and search controls
- Keyboard navigation for all filter controls and result lists
- Screen reader announcements for filter application and result counts
- Sufficient color contrast for player scores and statistics
- Focus indicators for interactive elements
- Table structures with proper headers for accessibility

**Q: Will this implementation perform well on both web and mobile clients?**
✅ YES - Design considerations:
- Pagination limits result sets to 50 players for mobile performance
- Responsive filter UI (collapsible on mobile)
- Lazy loading for player statistics details
- Optimized queries with database indices
- Score calculations happen server-side (not client-side)
- Mobile-first responsive layout (filters collapse, touch-friendly controls)

**Q: How does this feature contribute to a simple and intuitive user experience?**
✅ YES - Simplicity focus:
- Clear filter categories (position, team, date range) with standard controls
- Real-time result updates as filters are applied
- Persistent filter state during session
- Saved searches provide quick access to common queries
- Score breakdown modal explains how scores are calculated
- Clear empty states and zero-result messaging

### Functional Requirements

**Q: Does this feature respect user privacy and data security?**
✅ YES - Privacy measures:
- Saved searches are user-scoped (no sharing in MVP)
- Player data is public MLB statistics (no privacy concerns)
- Authentication required to access feature
- Audit logging for saved search CRUD operations
- User data deletion includes saved searches

### Technical Implementation

**Q: Can this feature scale with a growing user base?**
✅ YES - Scalability approach:
- Player data cached in PostgreSQL (not fetched per request)
- Hourly background job refreshes statistics (not on-demand)
- Database indices on filter columns (position, team, date)
- Pagination prevents large result set memory issues
- Score calculations use indexed scoring configuration data
- Stateless API design allows horizontal scaling

### Post-Design Re-Check

All constitution checks remain valid after design phase:

✅ **Accessibility**: Data models and API contracts support accessibility requirements
- API responses include all necessary data for screen readers
- No client-side-only features that would exclude assistive technologies
- Pagination prevents performance issues on mobile/assistive devices

✅ **Performance**: Design supports performance goals
- Database indices on all filter columns
- JSONB for flexible statistics without performance penalty
- Server-side score calculations prevent client payload bloat
- Pagination limits result sets

✅ **Privacy & Security**: Design maintains security standards
- SavedSearch user-scoped with foreign key constraints
- JWT authentication required for all endpoints
- Audit logging via existing AuditLog table
- No sensitive data in player statistics (all public MLB data)

✅ **Scalability**: Architecture supports growth
- Stateless API design (horizontal scaling)
- Background job for data refresh (not on-demand)
- Caching strategy reduces external API dependency
- Database design supports millions of statistics records

**No constitution violations. Design approved for implementation.**

## Project Structure

### Documentation (this feature)

```text
specs/002-player-research/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── player-research-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Existing (authentication)
│   │   ├── users/             # Existing (user management)
│   │   ├── scoring-configs/   # Existing (scoring configurations)
│   │   ├── players/           # NEW (player data, statistics)
│   │   ├── player-research/   # NEW (search, filters, saved searches)
│   │   └── mlb-stats/         # NEW (MLB-StatsAPI client)
│   ├── common/                # Existing (shared utilities, guards)
│   ├── prisma/                # Existing (Prisma client, schema)
│   └── main.ts
├── prisma/
│   └── schema.prisma          # Updated (new models for players, saved searches)
└── test/                      # Existing (test infrastructure)

frontend/
├── src/
│   ├── components/
│   │   ├── auth/              # Existing (login, signup)
│   │   ├── scoring-configs/   # Existing (scoring configuration UI)
│   │   └── player-research/   # NEW (search, filters, results, saved searches)
│   ├── pages/
│   │   ├── PlayerResearch.tsx # NEW (main player research page)
│   │   └── ...                # Existing pages
│   ├── services/
│   │   └── api.ts             # Updated (player research API calls)
│   └── types/                 # Updated (player, search types)
```

**Structure Decision**: Web application structure (Option 2) with separate frontend and backend. This aligns with the existing codebase structure. New modules added to backend for player data management and research functionality. Frontend adds new component directory and page for player research UI.

## Complexity Tracking

*No constitution violations identified. All checks passed.*

## Phase 0: Research Requirements

The following items require research and will be documented in `research.md`:

1. **MLB-StatsAPI Integration**
   - Research MLB-StatsAPI endpoints for player data and statistics
   - Determine authentication/rate limiting requirements
   - Identify optimal data refresh strategy (hourly batch vs. on-demand)
   - Document response formats and data mapping

2. **Player Statistics Caching Strategy**
   - Research optimal caching approach for player statistics
   - Determine cache invalidation strategy (time-based, event-based)
   - Evaluate JSONB vs. relational model for statistics storage
   - Document query patterns for filter performance

3. **Score Calculation Performance**
   - Research best practices for real-time score calculations across large player sets
   - Evaluate server-side vs. client-side calculation trade-offs
   - Determine if pre-calculated scores should be cached
   - Document calculation complexity and optimization opportunities

4. **Saved Search Data Model**
   - Research filter serialization formats (JSON, query string)
   - Determine if scoring configuration should be embedded or referenced
   - Evaluate versioning needs for saved searches if filters evolve
   - Document best practices for user-scoped search persistence

## Phase 1: Design Artifacts

The following artifacts will be generated in Phase 1:

1. **data-model.md** - Data models for:
   - Player (MLB player entity with metadata)
   - PlayerStatistic (time-series statistics)
   - SavedSearch (filter combinations with user association)
   - Relationships to existing User and ScoringConfiguration models

2. **contracts/player-research-api.yaml** - OpenAPI specification for:
   - GET /api/players - Search and filter players
   - GET /api/players/:id - Get player details
   - GET /api/players/:id/score-breakdown - Get scoring breakdown
   - POST /api/saved-searches - Create saved search
   - GET /api/saved-searches - List user's saved searches
   - PUT /api/saved-searches/:id - Update saved search
   - DELETE /api/saved-searches/:id - Delete saved search

3. **quickstart.md** - Integration scenarios:
   - Scenario 1: User applies filters and views scored players
   - Scenario 2: User saves and reuses a search
   - Scenario 3: User changes scoring configuration and sees scores update
   - Scenario 4: Background job refreshes player statistics

## Notes

- This feature builds on existing authentication (feature 001) and scoring configurations (feature 002)
- MLB-StatsAPI is a free/open-source API as specified in the original platform specification
- Frontend implementation will follow existing patterns from scoring configurations UI
- Database schema additions will extend existing Prisma schema
- All new code will follow existing test coverage standards (unit + e2e tests)
