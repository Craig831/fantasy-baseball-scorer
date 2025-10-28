# Quickstart: Player Research and Scoring Platform

**Feature**: 001-player-research-scoring
**Date**: 2025-10-24
**Phase**: 1 - Integration Test Scenarios

## Overview

This document provides integration test scenarios that validate end-to-end user workflows for the Player Research and Scoring Platform. These scenarios map directly to the user stories (P1-P5) defined in spec.md and serve as acceptance criteria for implementation.

## Prerequisites

**Test Environment Setup**:
- Backend API running on `http://localhost:3000`
- PostgreSQL database seeded with test data
- Redis cache available
- MLB player data synced (minimum 100 players)

**Test Data**:
- 3 test users: `alice@test.com`, `bob@test.com`, `charlie@test.com`
- 2 scoring configurations per user
- 30 MLB teams, ~1000 active players
- Historical stats for past 7 days

## Integration Test Scenarios

### Scenario 1: User Registration and Login (User Story P1)

**Goal**: Validate complete user account creation and authentication flow

**Steps**:

1. **Register New User**
   ```http
   POST /api/auth/register
   {
     "email": "newuser@test.com",
     "password": "SecureP@ssw0rd123!"
   }
   ```
   - **Expected**: 201 Created
   - **Verify**: User record created in database
   - **Verify**: Email verification token generated
   - **Verify**: AuditLog entry created (action: 'register')

2. **Verify Email**
   ```http
   GET /api/auth/verify-email?token={verification_token}
   ```
   - **Expected**: 200 OK
   - **Verify**: `email_verified = true` in database

3. **Login**
   ```http
   POST /api/auth/login
   {
     "email": "newuser@test.com",
     "password": "SecureP@ssw0rd123!"
   }
   ```
   - **Expected**: 200 OK with `accessToken` and `refreshToken`
   - **Verify**: JWT token payload contains `userId`, `email`
   - **Verify**: RefreshToken record created in database
   - **Verify**: AuditLog entry created (action: 'login')

4. **Access Protected Resource**
   ```http
   GET /api/users/me
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with user profile
   - **Verify**: Response includes `id`, `email`, `emailVerified: true`

5. **Refresh Token**
   ```http
   POST /api/auth/refresh
   {
     "refreshToken": "{refresh_token}"
   }
   ```
   - **Expected**: 200 OK with new `accessToken` and `refreshToken`
   - **Verify**: Old refresh token revoked
   - **Verify**: New refresh token created

6. **Logout**
   ```http
   POST /api/auth/logout
   Authorization: Bearer {accessToken}
   {
     "refreshToken": "{refresh_token}"
   }
   ```
   - **Expected**: 200 OK
   - **Verify**: Refresh token revoked in database
   - **Verify**: AuditLog entry created (action: 'logout')

**Acceptance Criteria**:
- ✅ User can register with valid email and password
- ✅ Email verification flow completes successfully
- ✅ User can login and receive JWT tokens
- ✅ Access token grants access to protected routes
- ✅ Refresh token can be used to obtain new access token
- ✅ Logout invalidates refresh token
- ✅ All authentication events logged

---

### Scenario 2: MFA Setup and Login (User Story P1 - MFA)

**Goal**: Validate multi-factor authentication setup and usage

**Prerequisite**: User logged in from Scenario 1

**Steps**:

1. **Setup MFA**
   ```http
   POST /api/auth/mfa/setup
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with `secret` and `qrCodeUrl`
   - **Verify**: `mfa_secret` stored encrypted in database
   - **Verify**: `mfa_enabled = false` (not yet verified)

2. **Verify MFA with TOTP Code**
   ```http
   POST /api/auth/mfa/verify
   Authorization: Bearer {accessToken}
   {
     "code": "123456"  // Generated from TOTP secret
   }
   ```
   - **Expected**: 200 OK with recovery codes
   - **Verify**: `mfa_enabled = true` in database
   - **Verify**: Recovery codes generated

3. **Logout and Re-login with MFA**
   ```http
   POST /api/auth/login
   {
     "email": "newuser@test.com",
     "password": "SecureP@ssw0rd123!",
     "mfaCode": "789012"  // Current TOTP code
   }
   ```
   - **Expected**: 200 OK with tokens
   - **Verify**: Login fails without mfaCode (401 MFA_REQUIRED)
   - **Verify**: Login succeeds with valid mfaCode

**Acceptance Criteria**:
- ✅ User can setup MFA and receive QR code
- ✅ TOTP verification enables MFA on account
- ✅ MFA-enabled users must provide TOTP code during login
- ✅ Recovery codes generated for account recovery

---

### Scenario 3: Create and Manage Scoring Configuration (User Story P2)

**Goal**: Validate custom scoring configuration management

**Prerequisite**: User logged in

**Steps**:

1. **Create Scoring Configuration**
   ```http
   POST /api/scoring-configs
   Authorization: Bearer {accessToken}
   {
     "name": "My Custom League",
     "categories": {
       "batting": {
         "hits": 1.0,
         "doubles": 2.0,
         "homeRuns": 4.0,
         "runs": 1.0,
         "rbis": 1.0
       },
       "pitching": {
         "wins": 5.0,
         "strikeouts": 1.0,
         "saves": 5.0
       }
     },
     "isActive": true
   }
   ```
   - **Expected**: 201 Created with scoring config
   - **Verify**: Config stored with user_id
   - **Verify**: JSONB categories persisted correctly
   - **Verify**: `is_active = true`

2. **List Scoring Configurations**
   ```http
   GET /api/scoring-configs
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with array of configs
   - **Verify**: Only user's configs returned
   - **Verify**: Active config marked `isActive: true`

3. **Update Scoring Configuration**
   ```http
   PATCH /api/scoring-configs/{config_id}
   Authorization: Bearer {accessToken}
   {
     "name": "Updated League Name",
     "categories": {
       "batting": {
         "homeRuns": 5.0  // Increased value
       }
     }
   }
   ```
   - **Expected**: 200 OK with updated config
   - **Verify**: Name and categories updated
   - **Verify**: `updated_at` timestamp changed

4. **Activate Different Configuration**
   ```http
   PATCH /api/scoring-configs/{another_config_id}/activate
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK
   - **Verify**: Previous active config now `is_active = false`
   - **Verify**: New config `is_active = true`
   - **Verify**: Only one active config per user

5. **Delete Scoring Configuration**
   ```http
   DELETE /api/scoring-configs/{config_id}
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 204 No Content
   - **Verify**: Config removed from database
   - **Verify**: Lineups referencing config have `scoring_config_id = NULL`

**Acceptance Criteria**:
- ✅ User can create custom scoring configurations
- ✅ Configurations support flexible JSONB stat categories
- ✅ User can set one configuration as active/default
- ✅ Configurations can be updated and deleted
- ✅ Deleting config doesn't break existing lineups

---

### Scenario 4: Player Research and Filtering (User Story P3)

**Goal**: Validate player search, filtering, and score calculation

**Prerequisite**: User logged in with active scoring configuration

**Steps**:

1. **Search All Players (No Filters)**
   ```http
   GET /api/players?page=1&limit=20&sort=score:desc
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with paginated players
   - **Verify**: Each player has `projectedScore` based on active config
   - **Verify**: Results sorted by score descending
   - **Verify**: Pagination meta includes total count

2. **Filter by Team and Position**
   ```http
   GET /api/players?team=NYY&position=OF&sort=score:desc
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK
   - **Verify**: All results have `team = 'NYY'` and `position = 'OF'`
   - **Verify**: Results include Aaron Judge (if in test data)

3. **Search by Player Name**
   ```http
   GET /api/players?search=Judge&page=1&limit=20
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK
   - **Verify**: Results match partial name search
   - **Verify**: Full-text search index used (fast response <500ms)

4. **Get Player Details**
   ```http
   GET /api/players/660271  // Aaron Judge MLB ID
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with player details
   - **Verify**: Includes `seasonStats` summary
   - **Verify**: Includes `recentGames` array (last 10)
   - **Verify**: Includes `scoringBreakdown` by category

5. **Change Active Scoring Config and Re-query**
   ```http
   PATCH /api/scoring-configs/{other_config_id}/activate
   Authorization: Bearer {accessToken}

   GET /api/players?team=NYY&position=OF
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK with recalculated scores
   - **Verify**: `projectedScore` values differ from previous query
   - **Verify**: Scores calculated using new active config

**Acceptance Criteria**:
- ✅ Player search returns results with calculated scores
- ✅ Filtering by team and position works correctly
- ✅ Player name search uses full-text index
- ✅ Player detail view includes stats and scoring breakdown
- ✅ Changing active scoring config recalculates all scores
- ✅ Query performance <500ms for 1000+ player dataset

---

### Scenario 5: Create and Manage Lineup (User Story P4)

**Goal**: Validate lineup creation, player assignment, and scoring

**Prerequisite**: User logged in, scoring config active, players available

**Steps**:

1. **Create Empty Lineup**
   ```http
   POST /api/lineups
   Authorization: Bearer {accessToken}
   {
     "name": "Week 1 Lineup",
     "scoringConfigId": "{config_id}",
     "gameDate": "2025-10-25"
   }
   ```
   - **Expected**: 201 Created with lineup
   - **Verify**: Lineup created with default slots (C, 1B, 2B, SS, 3B, OF1-3, UTIL, P1-2)
   - **Verify**: All slots have `playerId = null`
   - **Verify**: `projectedScore = 0.0`

2. **Add Player to Slot**
   ```http
   PATCH /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   {
     "slots": [
       {
         "position": "OF1",
         "playerId": "660271"  // Aaron Judge
       }
     ]
   }
   ```
   - **Expected**: 200 OK
   - **Verify**: Slot updated with player
   - **Verify**: Slot `projectedScore` calculated
   - **Verify**: Lineup `projectedScore` updated (sum of slots)
   - **Verify**: Position compatibility validated (OF player in OF slot)

3. **Add Multiple Players**
   ```http
   PATCH /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   {
     "slots": [
       {"position": "C", "playerId": "668800"},  // Salvador Perez
       {"position": "1B", "playerId": "660670"},  // Vladimir Guerrero Jr
       {"position": "SS", "playerId": "665487"}   // Fernando Tatis Jr
     ]
   }
   ```
   - **Expected**: 200 OK
   - **Verify**: All slots updated
   - **Verify**: Lineup total score recalculated
   - **Verify**: Validation prevents same player in multiple slots

4. **Remove Player from Slot**
   ```http
   PATCH /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   {
     "slots": [
       {"position": "C", "playerId": null}
     ]
   }
   ```
   - **Expected**: 200 OK
   - **Verify**: Slot emptied (`playerId = null`)
   - **Verify**: Lineup total score recalculated (decreased)

5. **Get Full Lineup with Players**
   ```http
   GET /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK
   - **Verify**: Lineup includes all slots with player details
   - **Verify**: Each occupied slot shows player name, team, position
   - **Verify**: Projected score accurate

6. **Duplicate Lineup**
   ```http
   POST /api/lineups/{lineup_id}/duplicate
   Authorization: Bearer {accessToken}
   {
     "name": "Week 2 Lineup (Copy)"
   }
   ```
   - **Expected**: 201 Created
   - **Verify**: New lineup created with same players
   - **Verify**: New lineup has unique ID
   - **Verify**: Scores match original lineup

7. **Delete Lineup**
   ```http
   DELETE /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 204 No Content
   - **Verify**: Lineup soft-deleted (`deleted_at` set)
   - **Verify**: Not returned in list queries
   - **Verify**: LineupSlots cascade deleted

**Acceptance Criteria**:
- ✅ User can create lineups with baseball position slots
- ✅ Players can be added to compatible positions
- ✅ Lineup total score updates automatically
- ✅ Position validation prevents invalid assignments
- ✅ Lineups can be duplicated for quick creation
- ✅ Lineups can be deleted (soft delete)

---

### Scenario 6: Post-Game Actual Scoring (User Story P4 - Actual Scores)

**Goal**: Validate actual score calculation after games complete

**Prerequisite**: Lineup created with players, games completed

**Steps**:

1. **Trigger Post-Game Scoring Job** (Simulated)
   - Run hourly sync job after games conclude
   - **Verify**: PlayerStatistic records created for game day
   - **Verify**: LineupSlot `actualScore` calculated
   - **Verify**: Lineup `actualScore` calculated (sum of slots)

2. **View Lineup with Actual vs Projected Scores**
   ```http
   GET /api/lineups/{lineup_id}
   Authorization: Bearer {accessToken}
   ```
   - **Expected**: 200 OK
   - **Verify**: Lineup has `actualScore` populated
   - **Verify**: Each slot shows `projectedScore` vs `actualScore`
   - **Verify**: Difference calculated (actual - projected)

**Acceptance Criteria**:
- ✅ Actual scores calculated after games conclude
- ✅ Lineups display projected vs actual comparison
- ✅ Post-game scoring uses same scoring configuration

---

### Scenario 7: Mobile-First Responsive Design (User Story P5)

**Goal**: Validate mobile accessibility and performance

**Testing Method**: Manual testing on mobile devices + Lighthouse CI

**Steps**:

1. **Mobile Device Testing**
   - Test on iPhone (iOS 17) and Android (Pixel 8)
   - Navigate all pages: Login, Signup, Dashboard, Scoring, Players, Lineups, Account
   - **Verify**: All pages adapt to screen width
   - **Verify**: Touch targets ≥ 44x44 px
   - **Verify**: No horizontal scrolling required
   - **Verify**: Navigation menu accessible and usable

2. **Lighthouse Performance Audit**
   ```bash
   lighthouse https://localhost:3000 --preset=mobile --output=json
   ```
   - **Verify**: Performance score ≥ 90
   - **Verify**: Accessibility score ≥ 95
   - **Verify**: First Contentful Paint < 1.5s
   - **Verify**: Largest Contentful Paint < 2.5s

3. **Keyboard Navigation**
   - Use Tab key to navigate all pages
   - **Verify**: All interactive elements focusable
   - **Verify**: Focus indicators visible
   - **Verify**: Logical tab order maintained

4. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac/iOS)
   - **Verify**: All images have alt text
   - **Verify**: Form labels announced correctly
   - **Verify**: ARIA labels present on complex components
   - **Verify**: Error messages read aloud

**Acceptance Criteria**:
- ✅ Mobile-first design works on iOS and Android
- ✅ Lighthouse scores meet targets (90+ performance, 95+ accessibility)
- ✅ Keyboard navigation fully functional
- ✅ Screen reader compatible (WCAG 2.1 Level AA)

---

## Performance Benchmarks

**API Response Times** (measured with 1000 concurrent users):
- `GET /api/players` (filtered): < 500ms (p95)
- `GET /api/lineups/{id}`: < 200ms (p95)
- `POST /api/lineups`: < 300ms (p95)
- `PATCH /api/lineups/{id}`: < 400ms (p95)

**Database Query Performance**:
- Player search with filters: < 100ms
- Lineup with slots (JOIN): < 50ms
- Scoring config fetch: < 10ms

**Frontend Performance**:
- First Contentful Paint: < 1.5s (3G)
- Time to Interactive: < 3.5s (3G)
- Total Blocking Time: < 300ms

## Error Handling Scenarios

**Scenario 8: Invalid Input Validation**
- Submit invalid email format → 400 Bad Request with field error
- Submit weak password → 400 Bad Request with password requirements
- Assign incompatible player to position → 400 Bad Request with validation error
- Create scoring config with negative values → 400 Bad Request

**Scenario 9: Authorization Failures**
- Access another user's lineup → 404 Not Found (not 403 to prevent enumeration)
- Delete another user's scoring config → 404 Not Found
- Access protected route without token → 401 Unauthorized

**Scenario 10: Rate Limiting**
- Exceed 100 requests/15 min → 429 Too Many Requests
- Retry-After header included in response

## Summary

These integration test scenarios validate all functional requirements (FR-001 through FR-035) and success criteria (SC-001 through SC-012). Each scenario maps to user stories and provides clear acceptance criteria for implementation verification.

**Test Coverage**:
- ✅ User Story P1: User Account Management (Scenarios 1-2)
- ✅ User Story P2: Scoring Settings Configuration (Scenario 3)
- ✅ User Story P3: Player Research with Filters (Scenario 4)
- ✅ User Story P4: Lineup Creation and Scoring (Scenarios 5-6)
- ✅ User Story P5: Mobile-Optimized Interface (Scenario 7)
- ✅ Error Handling and Security (Scenarios 8-10)

All scenarios should be automated using Jest + Supertest for backend and Playwright for frontend end-to-end testing.
