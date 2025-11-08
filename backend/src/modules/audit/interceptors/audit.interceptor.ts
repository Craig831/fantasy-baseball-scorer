/**
 * Audit Interceptor
 * Automatically logs authentication and security events
 * Apply to controllers with @UseInterceptors(AuditInterceptor)
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

/**
 * Map of route patterns to audit action names
 * Add more routes as needed for comprehensive audit logging
 */
const AUDIT_ACTION_MAP: Record<string, string> = {
  'POST /auth/register': 'USER_REGISTERED',
  'POST /auth/login': 'USER_LOGIN',
  'POST /auth/logout': 'USER_LOGOUT',
  'POST /auth/verify-email': 'EMAIL_VERIFIED',
  'POST /auth/reset-password': 'PASSWORD_RESET',
  'POST /auth/mfa/setup': 'MFA_SETUP',
  'POST /auth/mfa/verify': 'MFA_ENABLED',
  'POST /auth/mfa/disable': 'MFA_DISABLED',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.route?.path || request.url;
    const routeKey = `${method} ${url}`;

    // Check if this route should be audited
    const action = AUDIT_ACTION_MAP[routeKey];

    if (!action) {
      // Not an audited route, pass through without logging
      return next.handle();
    }

    // Extract request context
    const user = request.user; // Set by JwtAuthGuard if authenticated
    const ipAddress = request.ip || request.connection?.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'];

    // Handle the request and log on successful completion
    return next.handle().pipe(
      tap({
        next: async (response) => {
          // Log successful audit event
          await this.auditService.logEvent({
            userId: user?.id || response?.user?.id,
            action,
            entityType: 'User',
            entityId: user?.id || response?.user?.id || 'unknown',
            ipAddress,
            userAgent,
            metadata: {
              method,
              url,
              statusCode: 200,
            },
          });
        },
        error: async (error) => {
          // Also log failed attempts (important for security monitoring)
          await this.auditService.logEvent({
            userId: user?.id,
            action: `${action}_FAILED`,
            entityType: 'User',
            entityId: user?.id || 'unknown',
            ipAddress,
            userAgent,
            metadata: {
              method,
              url,
              error: error.message,
              statusCode: error.status || 500,
            },
          });
        },
      }),
    );
  }
}
