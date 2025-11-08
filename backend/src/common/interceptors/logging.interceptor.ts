import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    // Extract user ID if available (from JWT payload)
    const user = (request as any).user;
    const userId = user?.sub || user?.id || 'anonymous';

    // Generate correlation ID for request tracking
    const correlationId = this.generateCorrelationId();
    request.headers['x-correlation-id'] = correlationId;

    return next.handle().pipe(
      tap({
        next: () => {
          const executionTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log({
            correlationId,
            method,
            url,
            statusCode,
            executionTime: `${executionTime}ms`,
            userId,
            ip,
            userAgent,
          });
        },
        error: (error) => {
          const executionTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error({
            correlationId,
            method,
            url,
            statusCode,
            executionTime: `${executionTime}ms`,
            userId,
            ip,
            errorName: error.name,
            errorMessage: error.message,
            // Do NOT log sensitive data:
            // - passwords
            // - tokens
            // - credit cards
            // - full request bodies
          });
        },
      }),
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
