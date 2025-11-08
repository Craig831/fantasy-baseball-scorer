/**
 * MFA Guard
 * Enforces MFA verification for sensitive operations
 * Use with @UseGuards(JwtAuthGuard, MfaGuard) to require MFA
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    // Must be authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // If MFA is not enabled for this user, allow through
    if (!user.mfaEnabled) {
      return true;
    }

    // If MFA is enabled, require MFA token
    // Check both header and body for flexibility
    const mfaToken =
      request.headers['x-mfa-token'] || request.body?.mfaToken;

    if (!mfaToken) {
      throw new UnauthorizedException(
        'MFA token required. Please provide MFA code in X-MFA-Token header or mfaToken body field.',
      );
    }

    // Validate MFA token
    try {
      await this.authService.validateMFALogin(user.id, mfaToken);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
  }
}
