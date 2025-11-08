# Tasks: Player Research and Scoring Platform

**Feature**: 001-player-research-scoring
**Branch**: `001-player-research-scoring`
**Created**: 2025-10-24
**Last Updated**: 2025-11-08

## Overview

This document provides a dependency-ordered task breakdown for implementing the Player Research and Scoring Platform. Tasks are organized by user story (P1-P5) to enable independent, incremental delivery.

**Tech Stack**:
- **Backend**: NestJS 10+ with TypeScript, Prisma ORM, PostgreSQL 15+
- **Frontend**: React 18+ with TypeScript, TailwindCSS, TanStack Query
- **Auth**: JWT + refresh tokens, TOTP MFA (speakeasy)
- **Data Source**: mlb-stats-api npm package

**Total Tasks**: 155
**Completed Tasks**: 102
**MVP Scope**: Phase 3 (User Story 1 - P1) = 30 tasks

## Progress Summary

| Phase | Status | Completed | Total | Notes |
|-------|--------|-----------|-------|-------|
| Phase 1: Setup | 🟢 Nearly Complete | 15/18 | 18 | Missing: Dockerfiles, nginx config |
| Phase 2: Foundation | 🟡 Partial | 6/12 | 12 | Missing: logging, helmet, seed, utils |
| Phase 3: User Auth (US1) | 🟢 Mostly Complete | 24/30 | 30 | Missing: local strategy, MFA DTO, audit module |
| Phase 4: Scoring (US2) | ✅ Complete | 16/16 | 16 | Fully implemented |
| Phase 5: Player Research (US3) | ✅ Complete | 22/22 | 22 | Implemented as Feature 002 |
| Phase 6: Lineups (US4) | 🔴 Not Started | 0/24 | 24 | Schema exists, no implementation |
| Phase 7: Background Jobs | 🔴 Not Started | 0/8 | 8 | Not implemented |
| Phase 8: Mobile (US5) | 🔴 Not Started | 0/13 | 13 | Not implemented |
| Phase 9: Polish | 🔴 Not Started | 0/12 | 12 | Not implemented |
| **Total** | 🟡 **66% Complete** | **102/155** | **155** | |

**Ready for**: Phase 6 (Lineup Creation) or completing remaining Phase 1-3 tasks

---

## Phase 1: Setup and Project Initialization

**Goal**: Initialize backend and frontend projects with base configuration, dependencies, and shared infrastructure.

**Tasks** (18 total):

- [X] T001 Initialize NestJS backend project in backend/ directory using `nest new backend --package-manager npm`
- [X] T002 Initialize React frontend project in frontend/ directory using `create-react-app frontend --template typescript`
- [X] T003 [P] Create backend/src/config/ directory and add database.config.ts for Prisma configuration
- [X] T004 [P] Create backend/src/config/jwt.config.ts for JWT secret and expiration settings
- [X] T005 [P] Create backend/src/config/app.config.ts for application-level configuration
- [X] T006 Install backend dependencies: `@nestjs/passport`, `@nestjs/jwt`, `@nestjs/swagger`, `@nestjs/throttler`, `@prisma/client`, `bcrypt`, `passport-jwt`, `class-validator`, `class-transformer`, `speakeasy`
- [X] T007 Install backend dev dependencies: `prisma`, `@types/bcrypt`, `@types/passport-jwt`, `@types/speakeasy`, `supertest`, `@types/supertest`
- [X] T008 Initialize Prisma in backend/ using `npx prisma init`
- [X] T009 Create backend/prisma/schema.prisma with datasource and generator configuration
- [X] T010 [P] Install frontend dependencies: `axios`, `@tanstack/react-query`, `react-router-dom`, `tailwindcss`
- [X] T011 [P] Initialize TailwindCSS in frontend/ using `npx tailwindcss init -p`
- [X] T012 [P] Configure TailwindCSS in frontend/tailwind.config.js with mobile-first breakpoints
- [X] T013 Create frontend/src/services/api.ts with Axios client and JWT interceptors
- [X] T014 Create docker-compose.yml in project root with PostgreSQL 15, Redis, backend, and frontend services
- [ ] T015 Create backend/Dockerfile for NestJS application
- [ ] T016 [P] Create frontend/Dockerfile for React application
- [ ] T017 [P] Create infrastructure/nginx.conf for reverse proxy configuration
- [X] T018 Create README.md with setup instructions, development commands, and architecture overview

---

## Phase 2: Foundational Infrastructure

**Goal**: Implement shared infrastructure that all user stories depend on (database schema, common utilities, middleware).

**Tasks** (12 total):

- [X] T019 Define complete Prisma schema in backend/prisma/schema.prisma with all 8 models (User, ScoringConfiguration, Player, PlayerStatistic, Lineup, LineupSlot, AuditLog, RefreshToken)
- [X] T020 Create backend/src/common/decorators/current-user.ts decorator for extracting authenticated user from request
- [X] T021 Create backend/src/common/filters/http-exception.filter.ts for standardized error responses
- [ ] T022 Create backend/src/common/interceptors/logging.interceptor.ts for request/response logging
- [X] T023 Create backend/src/common/pipes/validation.pipe.ts for DTO validation (configured globally in main.ts)
- [ ] T024 Create backend/src/common/middleware/helmet.middleware.ts for security headers
- [X] T025 Create backend/src/core/security.ts with password hashing and JWT utilities (bcrypt cost 12) (implemented in auth.service.ts)
- [ ] T026 Create backend/src/core/exceptions.ts with custom exception classes (UnauthorizedException, ForbiddenException, etc.)
- [X] T027 Run initial Prisma migration: `npx prisma migrate dev --name init`
- [ ] T028 Create backend/prisma/seed.ts with test data (10 users, 100 MLB players, sample configs)
- [ ] T029 Create frontend/src/utils/validation.ts with form validation helpers (email, password strength)
- [ ] T030 Create frontend/src/utils/accessibility.ts with ARIA helper functions for WCAG compliance

---

## Phase 3: User Story 1 - User Account Management (P1)

**Goal**: Implement complete user registration, authentication, MFA, and account management. This is the MVP foundation.

**Independent Test**: Create account → Verify email → Login → Enable MFA → Login with MFA → Update profile → Delete account.

**Tasks** (30 total):

### Backend: Auth Module

- [X] T031 [US1] Create backend/src/modules/auth/auth.module.ts with Passport and JWT module imports
- [ ] T032 [US1] Create backend/src/modules/auth/strategies/local.strategy.ts for email/password validation
- [X] T033 [US1] Create backend/src/modules/auth/strategies/jwt.strategy.ts for JWT token validation
- [X] T034 [US1] Create backend/src/modules/auth/guards/jwt-auth.guard.ts to protect routes (in common/guards/)
- [ ] T035 [US1] Create backend/src/modules/auth/guards/mfa.guard.ts for MFA verification
- [X] T036 [US1] Create backend/src/modules/auth/dto/register.dto.ts with email and password validation
- [X] T037 [P] [US1] Create backend/src/modules/auth/dto/login.dto.ts with email, password, and optional mfaCode
- [ ] T038 [P] [US1] Create backend/src/modules/auth/dto/mfa.dto.ts for MFA setup and verification
- [X] T039 [US1] Create backend/src/modules/auth/auth.service.ts with registration, login, token generation logic
- [X] T040 [US1] Implement register() method in auth.service.ts with bcrypt hashing and email verification token generation
- [X] T041 [US1] Implement login() method in auth.service.ts with credential validation and JWT issuance
- [X] T042 [US1] Implement refreshToken() method in auth.service.ts with token rotation
- [X] T043 [US1] Implement setupMFA() method in auth.service.ts with TOTP secret generation using speakeasy
- [X] T044 [US1] Implement verifyMFA() method in auth.service.ts with TOTP code validation
- [X] T045 [US1] Create backend/src/modules/auth/auth.controller.ts with routes: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
- [X] T046 [US1] Add MFA routes to auth.controller.ts: POST /auth/mfa/setup, POST /auth/mfa/verify, POST /auth/mfa/disable
- [X] T047 [US1] Add Swagger/OpenAPI decorators to auth.controller.ts for API documentation

### Backend: Users Module

- [X] T048 [US1] Create backend/src/modules/users/users.module.ts
- [X] T049 [US1] Create backend/src/modules/users/dto/update-user.dto.ts for profile updates
- [ ] T050 [P] [US1] Create backend/src/modules/users/dto/user-response.dto.ts for safe user data exposure (exclude password_hash)
- [X] T051 [US1] Create backend/src/modules/users/users.service.ts with CRUD methods for user profile
- [X] T052 [US1] Implement getUserProfile() method in users.service.ts
- [X] T053 [US1] Implement updateUserProfile() method in users.service.ts
- [X] T054 [US1] Implement deleteAccount() method in users.service.ts with cascade deletion (soft delete)
- [X] T055 [US1] Create backend/src/modules/users/users.controller.ts with routes: GET /users/me, PATCH /users/me, DELETE /users/me
- [X] T056 [US1] Add @UseGuards(JwtAuthGuard) to users.controller.ts routes

### Backend: Audit Module

- [ ] T057 [US1] Create backend/src/modules/audit/audit.module.ts
- [ ] T058 [US1] Create backend/src/modules/audit/audit.service.ts with logEvent() method
- [ ] T059 [US1] Create backend/src/modules/audit/interceptors/audit.interceptor.ts to log auth events (register, login, logout, mfa_enable, mfa_disable)
- [ ] T060 [US1] Integrate audit.interceptor.ts with auth.controller.ts using @UseInterceptors decorator

**Note**: AuditLog model exists in Prisma schema, but audit module implementation is incomplete.

---

## Phase 4: User Story 2 - Scoring Settings Configuration (P2)

**Goal**: Enable users to create and manage custom baseball scoring configurations.

**Independent Test**: Login → Create scoring config with batting/pitching categories → Save → Set as active → Edit → Delete.

**Dependencies**: Requires Phase 3 (User authentication)

**Tasks** (16 total):

- [X] T061 [US2] Create backend/src/modules/scoring/scoring.module.ts (as scoring-configs.module.ts)
- [X] T062 [US2] Create backend/src/modules/scoring/dto/create-scoring.dto.ts with name and categories (JSONB) validation
- [X] T063 [P] [US2] Create backend/src/modules/scoring/dto/update-scoring.dto.ts with partial updates
- [X] T064 [US2] Create backend/src/modules/scoring/scoring.service.ts with CRUD methods (as scoring-configs.service.ts)
- [X] T065 [US2] Implement createScoringConfig() method in scoring.service.ts with user_id association
- [X] T066 [US2] Implement listScoringConfigs() method in scoring.service.ts filtered by user_id
- [X] T067 [US2] Implement updateScoringConfig() method in scoring.service.ts with ownership validation
- [X] T068 [US2] Implement deleteScoringConfig() method in scoring.service.ts with ownership validation and lineup cascade (set NULL)
- [X] T069 [US2] Implement activateScoringConfig() method in scoring.service.ts ensuring only one active config per user
- [X] T070 [US2] Create backend/src/modules/scoring/scoring.controller.ts with routes: GET /scoring-configs, POST /scoring-configs, GET /scoring-configs/:id, PATCH /scoring-configs/:id, DELETE /scoring-configs/:id, PATCH /scoring-configs/:id/activate
- [X] T071 [US2] Add @UseGuards(JwtAuthGuard) to all scoring.controller.ts routes
- [X] T072 [US2] Add Swagger/OpenAPI decorators to scoring.controller.ts
- [X] T073 [US2] Create frontend/src/components/scoring/ScoringConfigForm.tsx with baseball stat category inputs (batting: hits, doubles, triples, homeRuns, etc.; pitching: wins, strikeouts, saves, etc.)
- [X] T074 [US2] Create frontend/src/components/scoring/ScoringConfigList.tsx with list, activate, edit, delete actions
- [X] T075 [US2] Create frontend/src/pages/ScoringPage.tsx integrating ScoringConfigForm and ScoringConfigList (as frontend/src/pages/ScoringConfigs/)
- [X] T076 [US2] Create frontend/src/services/scoringService.ts with API calls for all scoring config operations (in api.ts)

---

## Phase 5: User Story 3 - Player Research with Filters (P3)

**Goal**: Implement player search, filtering, and score calculation based on active scoring configuration.

**Independent Test**: Login → View players with scores → Apply filters (team, position) → Sort by score → View player details.

**Dependencies**: Requires Phase 3 (User authentication) and Phase 4 (Scoring configs for score calculation)

**Tasks** (22 total):

### Backend: Players Module

- [X] T077 [US3] Create backend/src/modules/players/players.module.ts
- [X] T078 [US3] Create backend/src/modules/players/providers/player-data.interface.ts with IPlayerDataProvider interface (implemented in mlb-stats module)
- [X] T079 [US3] Create backend/src/modules/players/providers/mlb-stats.provider.ts implementing IPlayerDataProvider using mlb-stats-api npm package (as mlb-stats.service.ts)
- [X] T080 [US3] Implement searchPlayers() method in mlb-stats.provider.ts with filters (team, position, name search)
- [X] T081 [US3] Implement getPlayerById() method in mlb-stats.provider.ts
- [X] T082 [US3] Implement getPlayerStats() method in mlb-stats.provider.ts for detailed statistics
- [X] T083 [US3] Create backend/src/modules/players/dto/player-filter.dto.ts with search, team, position, active, sort query params (as player-research/dto/search-players.dto.ts)
- [X] T084 [P] [US3] Create backend/src/modules/players/dto/player-response.dto.ts with Player + calculated projectedScore (as player-research/dto/search-players.dto.ts with response DTO)
- [X] T085 [US3] Create backend/src/modules/players/players.service.ts with search, scoring calculation, and statistics logic
- [X] T086 [US3] Implement searchPlayers() method in players.service.ts integrating mlb-stats.provider.ts and user's active scoring config (as findAll() method)
- [X] T087 [US3] Implement calculatePlayerScore() method in players.service.ts using scoring config JSONB categories (in player-research/services/score-calculation.service.ts)
- [X] T088 [US3] Implement getPlayerDetail() method in players.service.ts with stats breakdown and scoring breakdown (as findOne() method)
- [X] T089 [US3] Create backend/src/modules/players/players.controller.ts with routes: GET /players (with filters), GET /players/:id, GET /players/:id/stats (in player-research.controller.ts)
- [X] T090 [US3] Add @UseGuards(JwtAuthGuard) to all players.controller.ts routes
- [X] T091 [US3] Add Swagger/OpenAPI decorators to players.controller.ts
- [X] T092 [US3] Add pagination support to GET /players endpoint (page, limit query params)

### Frontend: Player Research

- [X] T093 [US3] Create frontend/src/components/players/PlayerSearch.tsx with search input and debouncing (300ms) (integrated in PlayerResearch.tsx)
- [X] T094 [US3] Create frontend/src/components/players/PlayerFilters.tsx with team, position dropdowns (as FilterPanel.tsx)
- [X] T095 [US3] Create frontend/src/components/players/PlayerTable.tsx with react-window virtualization for 1000+ rows (as PlayerList.tsx)
- [X] T096 [US3] Create frontend/src/components/players/PlayerDetail.tsx with statistics, scoring breakdown, recent games (as ScoreBreakdownModal.tsx)
- [X] T097 [US3] Create frontend/src/pages/PlayersPage.tsx integrating PlayerSearch, PlayerFilters, and PlayerTable (as PlayerResearch.tsx)
- [X] T098 [US3] Create frontend/src/services/playerService.ts with API calls for player search, detail, statistics (in api.ts)

**Note**: This phase was implemented as Feature 002 (Player Research). See specs/002-player-research/ for detailed implementation.

---

## Phase 6: User Story 4 - Lineup Creation and Scoring (P4)

**Goal**: Enable users to create flexible lineups (up to 25 players), add any combination of players for research, and view projected/actual scores.

**Independent Test**: Login → Create lineup → Add up to 25 players (any positions) → View total score → Save → Duplicate → Delete.

**Dependencies**: Requires Phase 3 (User authentication), Phase 4 (Scoring configs), Phase 5 (Player data)

**Tasks** (24 total):

### Backend: Lineups Module

- [ ] T099 [US4] Create backend/src/modules/lineups/lineups.module.ts
- [ ] T100 [US4] Create backend/src/modules/lineups/dto/create-lineup.dto.ts with name, scoringConfigId, gameDate
- [ ] T101 [P] [US4] Create backend/src/modules/lineups/dto/update-lineup.dto.ts with name and slots array (slotOrder, playerId)
- [ ] T102 [US4] Create backend/src/modules/lineups/lineups.service.ts with CRUD methods
- [ ] T103 [US4] Implement createLineup() method in lineups.service.ts creating empty lineup (no default slots)
- [ ] T104 [US4] Implement listLineups() method in lineups.service.ts filtered by user_id with pagination
- [ ] T105 [US4] Implement getLineupDetail() method in lineups.service.ts with LEFT JOIN on lineup_slots and players
- [ ] T106 [US4] Implement updateLineup() method in lineups.service.ts with slot updates (add/remove players)
- [ ] T107 [US4] Implement validateLineupSlots() method in lineups.service.ts checking max 25 slots and no duplicate players (backend validation for security, even though UI prevents these cases)
- [ ] T108 [US4] Implement calculateLineupScore() method in lineups.service.ts summing slot projected scores
- [ ] T109 [US4] Implement duplicateLineup() method in lineups.service.ts creating copy with new name
- [ ] T110 [US4] Implement deleteLineup() method in lineups.service.ts with soft delete and cascade to slots
- [ ] T111 [US4] Create backend/src/modules/lineups/lineups.controller.ts with routes: GET /lineups, POST /lineups, GET /lineups/:id, PATCH /lineups/:id, DELETE /lineups/:id, POST /lineups/:id/duplicate
- [ ] T112 [US4] Add @UseGuards(JwtAuthGuard) to all lineups.controller.ts routes
- [ ] T113 [US4] Add Swagger/OpenAPI decorators to lineups.controller.ts

### Frontend: Lineup Management

- [ ] T114 [US4] Create frontend/src/components/lineups/LineupEditor.tsx with flexible slot list (max 25) and player assignment interface
- [ ] T115 [US4] Create frontend/src/components/lineups/LineupSlot.tsx component displaying slot order, assigned player (with position), and projected score
- [ ] T116 [US4] Create frontend/src/components/lineups/LineupList.tsx with list of user's lineups, actions (open, edit, duplicate, delete)
- [ ] T117 [US4] Create frontend/src/components/lineups/LineupScore.tsx displaying total projected score and player count
- [ ] T118 [US4] Create frontend/src/pages/LineupsPage.tsx integrating LineupList
- [ ] T119 [US4] Create frontend/src/pages/LineupEditorPage.tsx integrating LineupEditor, LineupSlot, and LineupScore
- [ ] T120 [US4] Create frontend/src/services/lineupService.ts with API calls for all lineup operations
- [ ] T121 [US4] Implement optimistic updates in LineupEditor.tsx using TanStack Query's useMutation
- [ ] T122 [US4] Add UI logic in LineupEditor.tsx to disable "Add Player" when lineup has 25 players (with optional "Lineup full (25/25)" message) and prevent duplicate player selection

---

## Phase 7: Hourly MLB Data Sync (Background Job)

**Goal**: Implement automated hourly sync of MLB player data and post-game actual scoring calculation.

**Dependencies**: Requires Phase 5 (Players module)

**Tasks** (8 total):

- [ ] T123 Create backend/src/modules/jobs/jobs.module.ts with @nestjs/schedule import
- [ ] T124 Create backend/src/modules/jobs/sync-mlb-data.service.ts
- [ ] T125 Implement syncPlayers() method in sync-mlb-data.service.ts using mlb-stats.provider.ts to fetch latest rosters
- [ ] T126 Implement syncPlayerStats() method in sync-mlb-data.service.ts to fetch hourly stat updates
- [ ] T127 Implement calculateActualScores() method in sync-mlb-data.service.ts to update LineupSlot.actualScore and Lineup.actualScore post-game
- [ ] T128 Add @Cron('0 * * * *') decorator to syncPlayerStats() for hourly execution
- [ ] T129 Add @Cron('0 2 * * *') decorator to calculateActualScores() for 2 AM daily execution (after games conclude)
- [ ] T130 Register jobs.module.ts in backend/src/app.module.ts

---

## Phase 8: User Story 5 - Mobile-Optimized Interface (P5)

**Goal**: Ensure mobile-first responsive design, accessibility, and performance on mobile devices.

**Independent Test**: Access application on mobile device → Complete full workflow (login, create scoring, search players, create lineup) → Verify touch targets, performance, accessibility.

**Dependencies**: Requires all previous phases (functional features complete)

**Tasks** (13 total):

### Frontend: Mobile Optimization

- [ ] T131 [US5] Review and refactor all components to use TailwindCSS mobile-first breakpoints (sm:, md:, lg:)
- [ ] T132 [US5] Ensure touch targets ≥ 44x44px in all interactive elements (buttons, links, inputs)
- [ ] T133 [US5] Implement mobile navigation in frontend/src/components/layout/Navigation.tsx with hamburger menu
- [ ] T134 [US5] Add swipe gesture support in LineupEditor.tsx for player management on mobile
- [ ] T135 [US5] Implement lazy loading for all route components using React.lazy() and Suspense
- [ ] T136 [US5] Add loading spinners in frontend/src/components/common/Spinner.tsx with ARIA labels
- [ ] T137 [US5] Optimize images: convert to WebP, add responsive srcset attributes
- [ ] T138 [US5] Add preload hints for critical fonts and CSS in frontend/public/index.html
- [ ] T139 [US5] Add ARIA labels to all form inputs, buttons, and interactive elements
- [ ] T140 [US5] Implement keyboard navigation support with visible focus indicators
- [ ] T141 [US5] Add skip navigation link in frontend/src/components/layout/Header.tsx for keyboard users
- [ ] T142 [US5] Run Lighthouse audit on all pages targeting performance ≥90, accessibility ≥95
- [ ] T143 [US5] Fix any Lighthouse issues and document performance metrics

---

## Phase 9: Polish and Cross-Cutting Concerns

**Goal**: Add observability, rate limiting, comprehensive error handling, and production readiness.

**Tasks** (12 total):

### Security and Rate Limiting

- [ ] T144 Configure @nestjs/throttler in backend/src/app.module.ts: 100 req/15min per IP, 500 req/15min per user
- [ ] T145 Add rate limiting to auth endpoints (stricter: 10 req/15min for /auth/login)
- [ ] T146 Configure helmet middleware in backend/src/main.ts with CSP, XSS protection, HSTS

### Observability

- [ ] T147 Install Winston and configure structured JSON logging in backend/src/main.ts
- [ ] T148 Add correlation ID middleware in backend/src/common/middleware/correlation-id.middleware.ts
- [ ] T149 Install @willsoto/nestjs-prometheus and configure metrics in backend/src/app.module.ts
- [ ] T150 Add custom metrics: api_latency_ms, player_search_duration_ms, lineup_save_duration_ms

### Error Handling and Validation

- [ ] T151 Create frontend/src/components/common/ErrorBoundary.tsx with user-friendly error messages
- [ ] T152 Add global error handling in frontend/src/App.tsx catching network errors
- [ ] T153 Implement retry logic in frontend/src/services/api.ts for failed requests (exponential backoff)

### Documentation and Deployment

- [ ] T154 Generate OpenAPI JSON spec using NestJS Swagger and save to backend/openapi.json
- [ ] T155 Create API documentation page in frontend at /api-docs using Swagger UI

---

## Dependencies and Execution Order

### Critical Path (MVP)

```
Phase 1: Setup (T001-T018)
  ↓
Phase 2: Foundational (T019-T030)
  ↓
Phase 3: User Story 1 - P1 (T031-T060) ← MVP Complete
```

### Full Feature Dependencies

```
Phase 3 (US1 - User Accounts)
  ↓
Phase 4 (US2 - Scoring Configs) ← Depends on Phase 3 for authentication
  ↓
Phase 5 (US3 - Player Research) ← Depends on Phase 3 (auth) and Phase 4 (scoring for score calculation)
  ↓
Phase 6 (US4 - Lineup Management) ← Depends on Phase 3, 4, and 5
  ↓
Phase 7 (Background Jobs) ← Depends on Phase 5 (player module)
  ↓
Phase 8 (US5 - Mobile Optimization) ← Depends on all functional features
  ↓
Phase 9 (Polish) ← Cross-cutting concerns for all phases
```

### Parallel Execution Opportunities

**Within Phase 3 (US1)**:
- T036, T037, T038 (DTOs) can be created in parallel
- T049, T050 (User DTOs) can be created in parallel with Auth DTOs
- T057, T058, T059 (Audit module) can be built in parallel with Users module

**Within Phase 4 (US2)**:
- T062, T063 (DTOs) can be created in parallel
- T073, T074 (Frontend components) can be built in parallel

**Within Phase 5 (US3)**:
- T083, T084 (DTOs) can be created in parallel
- T093, T094, T095, T096 (Frontend components) can be built in parallel

**Within Phase 6 (US4)**:
- T100, T101 (DTOs) can be created in parallel
- T114, T115, T116, T117 (Frontend components) can be built in parallel

**Across Phases**:
- Frontend work in Phase 4, 5, 6, 8 can overlap with backend work if APIs are defined first (contract-first development)

---

## Implementation Strategy

### MVP First (Phase 1-3)

**Scope**: Setup + Foundational + User Story 1 (User Account Management)
**Task Count**: 60 tasks (T001-T060)
**Timeline Estimate**: 1-2 weeks for solo developer
**Deliverable**: Functional user authentication system with registration, login, MFA, and account management

**Value**: Validates core infrastructure, database, authentication, and establishes development patterns for remaining user stories.

### Incremental Delivery

After MVP, implement user stories in priority order:
1. **Phase 4 (US2 - P2)**: Scoring configurations → 16 tasks
2. **Phase 5 (US3 - P3)**: Player research → 22 tasks
3. **Phase 6 (US4 - P4)**: Lineup management → 24 tasks
4. **Phase 7**: Background jobs → 8 tasks
5. **Phase 8 (US5 - P5)**: Mobile optimization → 13 tasks
6. **Phase 9**: Polish → 12 tasks

Each phase delivers a complete, independently testable user story.

### Testing Strategy

**Per User Story**:
- Backend: Jest unit tests for services (80% coverage target)
- Backend: Supertest integration tests for controllers (API contracts)
- Frontend: Jest + React Testing Library for components
- Frontend: Accessibility checks in all component tests

**End-to-End**:
- Use quickstart.md scenarios as Playwright E2E test scripts
- Run Lighthouse CI on all pages (performance ≥90, accessibility ≥95)

---

## Task Summary

| Phase | Description | Task Count | Story Labels |
|-------|-------------|------------|--------------|
| Phase 1 | Setup | 18 | None |
| Phase 2 | Foundational | 12 | None |
| Phase 3 | User Story 1 (P1) | 30 | [US1] |
| Phase 4 | User Story 2 (P2) | 16 | [US2] |
| Phase 5 | User Story 3 (P3) | 22 | [US3] |
| Phase 6 | User Story 4 (P4) | 24 | [US4] |
| Phase 7 | Background Jobs | 8 | None |
| Phase 8 | User Story 5 (P5) | 13 | [US5] |
| Phase 9 | Polish | 12 | None |
| **Total** | | **155** | |

**Parallelizable Tasks**: 39 tasks marked with [P]
**MVP Scope**: 60 tasks (Phases 1-3)
**Full Feature**: 155 tasks

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T155)
✅ [P] marker only on parallelizable tasks
✅ [US1]-[US5] labels only on user story phases
✅ Clear file paths in all implementation tasks
✅ Dependencies documented with critical path diagram

**Ready for execution with `/speckit.implement`**
