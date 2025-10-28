import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile for valid user', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        emailVerified: true,
        mfaEnabled: false,
        privacySettings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getUserProfile(userId);

      expect(result).toHaveProperty('email', user.email);
      expect(result).not.toHaveProperty('deletedAt');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user is deleted', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        deletedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.getUserProfile('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-123';
    const existingUser = {
      id: userId,
      email: 'old@example.com',
      passwordHash: 'hashed-password',
      deletedAt: null,
    };

    it('should successfully update email', async () => {
      const updateDto = { email: 'new@example.com' };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser) // First call - find existing user
        .mockResolvedValueOnce(null); // Second call - check if new email exists

      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        email: updateDto.email,
        emailVerified: false,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.updateUserProfile(userId, updateDto);

      expect(result.email).toBe(updateDto.email);
      expect(result.emailVerified).toBe(false);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const updateDto = { email: 'taken@example.com' };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other-user', email: updateDto.email });

      await expect(
        service.updateUserProfile(userId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update password and revoke refresh tokens', async () => {
      const updateDto = { password: 'NewSecurePass123!' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(existingUser);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.updateUserProfile(userId, updateDto);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { revoked: true },
      });
    });

    it('should successfully update privacy settings', async () => {
      const updateDto = { privacySettings: { shareProfile: false } };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        privacySettings: updateDto.privacySettings,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.updateUserProfile(userId, updateDto);

      expect(result.privacySettings).toEqual(updateDto.privacySettings);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserProfile('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should successfully soft delete account', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        deletedAt: new Date(),
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.deleteAccount(userId);

      expect(result.message).toBe('Account deleted successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user already deleted', async () => {
      const user = {
        id: 'user-123',
        deletedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.deleteAccount('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
