/**
 * DTOs for Multi-Factor Authentication operations
 */

import { IsString, Length, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for MFA setup request
 */
export class SetupMfaDto {
  @ApiPropertyOptional({
    example: 'My iPhone',
    description: 'Optional device name for tracking MFA device',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * DTO for MFA verification (during setup)
 */
export class VerifyMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code from authenticator app',
  })
  @IsString()
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'MFA code must contain only digits' })
  token: string;
}

/**
 * DTO for disabling MFA
 */
export class DisableMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit TOTP code to confirm MFA disable',
  })
  @IsString()
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'MFA code must contain only digits' })
  token: string;
}

/**
 * Response DTO for MFA setup
 */
export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Base32 encoded secret for TOTP',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  qrCode: string;
}
