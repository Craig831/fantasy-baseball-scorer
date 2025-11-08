/**
 * Domain-specific exception classes for consistent error handling
 * These provide clear, type-safe exceptions with meaningful messages
 */

import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';

// =============================================================================
// Authentication & Authorization Exceptions
// =============================================================================

/**
 * Thrown when user provides invalid email/password combination
 */
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

/**
 * Thrown when MFA code is required but not provided
 */
export class MFARequiredException extends UnauthorizedException {
  constructor() {
    super('Multi-factor authentication required');
  }
}

/**
 * Thrown when provided MFA code is invalid or expired
 */
export class InvalidMFACodeException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired MFA verification code');
  }
}

/**
 * Thrown when email verification token is invalid or expired
 */
export class InvalidVerificationTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired verification token');
  }
}

/**
 * Thrown when password reset token is invalid or expired
 */
export class InvalidPasswordResetTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired password reset token');
  }
}

/**
 * Thrown when JWT token is invalid, expired, or malformed
 */
export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired authentication token');
  }
}

/**
 * Thrown when user attempts to access a resource they don't own
 */
export class InsufficientPermissionsException extends ForbiddenException {
  constructor(resource: string) {
    super(`You do not have permission to access this ${resource}`);
  }
}

/**
 * Thrown when user's account is not verified
 */
export class EmailNotVerifiedException extends UnauthorizedException {
  constructor() {
    super('Please verify your email before logging in');
  }
}

// =============================================================================
// User & Account Exceptions
// =============================================================================

/**
 * Thrown when attempting to register with an email that already exists
 */
export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('An account with this email already exists');
  }
}

/**
 * Thrown when requested user is not found
 */
export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

/**
 * Thrown when user account has been deleted/deactivated
 */
export class AccountDeactivatedException extends ForbiddenException {
  constructor() {
    super('This account has been deactivated');
  }
}

// =============================================================================
// Scoring Configuration Exceptions
// =============================================================================

/**
 * Thrown when scoring configuration is not found
 */
export class ScoringConfigNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Scoring configuration not found: ${id}`);
  }
}

/**
 * Thrown when scoring configuration has invalid category structure
 */
export class InvalidScoringConfigException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid scoring configuration: ${message}`);
  }
}

/**
 * Thrown when attempting to activate a scoring config that doesn't exist
 */
export class CannotActivateScoringConfigException extends BadRequestException {
  constructor() {
    super('Cannot activate scoring configuration');
  }
}

/**
 * Thrown when attempting to delete an active scoring configuration
 */
export class CannotDeleteActiveScoringConfigException extends ConflictException {
  constructor() {
    super('Cannot delete active scoring configuration. Please activate another configuration first.');
  }
}

// =============================================================================
// Player & Statistics Exceptions
// =============================================================================

/**
 * Thrown when requested player is not found
 */
export class PlayerNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Player not found: ${identifier}`);
  }
}

/**
 * Thrown when player statistics are not available
 */
export class PlayerStatisticsNotFoundException extends NotFoundException {
  constructor(playerId: string, season?: number) {
    const seasonMsg = season ? ` for ${season} season` : '';
    super(`Statistics not available for player ${playerId}${seasonMsg}`);
  }
}

/**
 * Thrown when MLB Stats API request fails
 */
export class MLBStatsAPIException extends UnprocessableEntityException {
  constructor(message: string) {
    super(`MLB Stats API error: ${message}`);
  }
}

/**
 * Thrown when score cannot be calculated (missing config or stats)
 */
export class ScoreCalculationException extends UnprocessableEntityException {
  constructor(reason: string) {
    super(`Cannot calculate score: ${reason}`);
  }
}

// =============================================================================
// Lineup Management Exceptions
// =============================================================================

/**
 * Thrown when requested lineup is not found
 */
export class LineupNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Lineup not found: ${id}`);
  }
}

/**
 * Thrown when attempting to add player to lineup that already has 25 players
 */
export class LineupFullException extends BadRequestException {
  constructor() {
    super('Lineup is full. Maximum 25 players allowed.');
  }
}

/**
 * Thrown when attempting to add duplicate player to lineup
 */
export class DuplicatePlayerInLineupException extends ConflictException {
  constructor(playerName: string) {
    super(`${playerName} is already in this lineup`);
  }
}

/**
 * Thrown when attempting to modify locked lineup slot
 */
export class LineupSlotLockedException extends ConflictException {
  constructor(slotOrder: number) {
    super(`Lineup slot ${slotOrder} is locked and cannot be modified`);
  }
}

/**
 * Thrown when lineup slot order is invalid
 */
export class InvalidSlotOrderException extends BadRequestException {
  constructor() {
    super('Slot order must be between 1 and 25');
  }
}

/**
 * Thrown when lineup has no active scoring configuration
 */
export class LineupMissingScoringConfigException extends BadRequestException {
  constructor() {
    super('Lineup must have an active scoring configuration');
  }
}

// =============================================================================
// Saved Search Exceptions
// =============================================================================

/**
 * Thrown when requested saved search is not found
 */
export class SavedSearchNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Saved search not found: ${id}`);
  }
}

/**
 * Thrown when user attempts to create saved search with duplicate name
 */
export class DuplicateSavedSearchNameException extends ConflictException {
  constructor(name: string) {
    super(`You already have a saved search named "${name}"`);
  }
}

/**
 * Thrown when user reaches limit of 50 saved searches
 */
export class SavedSearchLimitExceededException extends BadRequestException {
  constructor() {
    super('You have reached the maximum of 50 saved searches');
  }
}

// =============================================================================
// Validation Exceptions (for complex business rules)
// =============================================================================

/**
 * Thrown when date range is invalid (dateFrom > dateTo)
 */
export class InvalidDateRangeException extends BadRequestException {
  constructor() {
    super('Start date must be before end date');
  }
}

/**
 * Thrown when season value is invalid
 */
export class InvalidSeasonException extends BadRequestException {
  constructor(season: number) {
    super(`Invalid season: ${season}. Season must be between 1900 and ${new Date().getFullYear() + 1}`);
  }
}

/**
 * Thrown when pagination parameters are invalid
 */
export class InvalidPaginationException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid pagination: ${message}`);
  }
}

/**
 * Thrown when sort parameter is invalid
 */
export class InvalidSortParameterException extends BadRequestException {
  constructor(field: string, allowedFields: string[]) {
    super(`Invalid sort field: ${field}. Allowed fields: ${allowedFields.join(', ')}`);
  }
}

// =============================================================================
// External API Exceptions
// =============================================================================

/**
 * Thrown when external API rate limit is exceeded
 */
export class RateLimitExceededException extends BadRequestException {
  constructor(retryAfter?: number) {
    const retryMsg = retryAfter ? ` Retry after ${retryAfter} seconds.` : '';
    super(`Rate limit exceeded.${retryMsg}`);
  }
}

/**
 * Thrown when external service is temporarily unavailable
 */
export class ServiceUnavailableException extends UnprocessableEntityException {
  constructor(serviceName: string) {
    super(`${serviceName} is temporarily unavailable. Please try again later.`);
  }
}
