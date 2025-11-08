/**
 * Audit Service
 * Centralized service for creating audit log entries
 * Handles security events, data modifications, and user actions
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   * Failures are logged but don't throw errors to avoid breaking user requests
   */
  async logEvent(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          ipAddress: data.ipAddress || 'unknown',
          userAgent: data.userAgent,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      // But log the error for monitoring
      this.logger.error('Failed to create audit log', {
        error: error.message,
        data,
      });
    }
  }

  /**
   * Convenience method for authentication events
   */
  async logAuthEvent(
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.logEvent({
      userId,
      action,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Convenience method for data modification events
   */
  async logDataEvent(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.logEvent({
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      metadata,
    });
  }
}
