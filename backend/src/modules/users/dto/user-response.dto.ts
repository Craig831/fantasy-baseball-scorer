/**
 * User Response DTO
 * Defines safe user data structure for API responses
 * Explicitly excludes sensitive fields like passwordHash, mfaSecret, tokens
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User unique identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Whether email has been verified',
  })
  emailVerified: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether multi-factor authentication is enabled',
  })
  mfaEnabled: boolean;

  @ApiPropertyOptional({
    example: { shareProfile: false, showStats: true },
    description: 'User privacy settings (JSON object)',
  })
  privacySettings?: Record<string, any>;

  @ApiProperty({
    example: '2025-10-24T12:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-08T10:30:00.000Z',
    description: 'Last account update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: '2025-11-08T09:15:00.000Z',
    description: 'Last successful login timestamp',
  })
  lastLoginAt?: Date | null;

  /**
   * Create UserResponseDto from Prisma User entity
   * Explicitly maps only safe fields, excluding:
   * - passwordHash
   * - mfaSecret
   * - emailVerificationToken
   * - deletedAt
   */
  static fromEntity(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      privacySettings: user.privacySettings,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
