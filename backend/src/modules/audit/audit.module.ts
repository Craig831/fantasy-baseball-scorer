/**
 * Audit Module
 * Centralized audit logging for security and compliance
 */

import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService], // Export for use in other modules
})
export class AuditModule {}
