import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        mfaEnabled: true,
        privacySettings: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { deletedAt, ...userWithoutDeletedAt } = user;
    return userWithoutDeletedAt;
  }

  async updateUserProfile(userId: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    // Update email
    if (updateDto.email && updateDto.email !== user.email) {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }

      updateData.email = updateDto.email;
      updateData.emailVerified = false; // Require re-verification
      // In production: Generate new verification token and send email
    }

    // Update password
    if (updateDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateDto.password, 12);

      // Revoke all refresh tokens when password changes
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }

    // Update privacy settings
    if (updateDto.privacySettings) {
      updateData.privacySettings = updateDto.privacySettings;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        mfaEnabled: true,
        privacySettings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'User',
        entityId: userId,
        ipAddress: '127.0.0.1',
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return updatedUser;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - mark account as deleted
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_ACCOUNT_DELETED',
        entityType: 'User',
        entityId: userId,
        ipAddress: '127.0.0.1',
        metadata: { softDelete: true },
      },
    });

    return { message: 'Account deleted successfully' };
  }
}
