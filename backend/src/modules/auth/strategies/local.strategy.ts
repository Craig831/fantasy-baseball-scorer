/**
 * Local Strategy
 * Passport strategy for email/password authentication
 * Validates user credentials before allowing access
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of default 'username'
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials
   * Called automatically by Passport when LocalAuthGuard is used
   * @param email - User email address
   * @param password - User password (plain text)
   * @returns User object if valid, throws UnauthorizedException if invalid
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
