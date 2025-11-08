/**
 * Local Auth Guard
 * Guard that triggers the LocalStrategy for email/password authentication
 * Use with @UseGuards(LocalAuthGuard) on login routes
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
