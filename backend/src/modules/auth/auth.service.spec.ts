import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const createdUser = {
        id: 'user-123',
        email: registerDto.email,
        emailVerified: false,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const user = {
        id: 'user-123',
        email: loginDto.email,
        passwordHash: await bcrypt.hash(loginDto.password, 12),
        emailVerified: true,
        mfaEnabled: false,
        deletedAt: null,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const user = {
        id: 'user-123',
        email: loginDto.email,
        passwordHash: await bcrypt.hash('CorrectPassword', 12),
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should require MFA code if MFA is enabled', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const user = {
        id: 'user-123',
        email: loginDto.email,
        passwordHash: await bcrypt.hash(loginDto.password, 12),
        mfaEnabled: true,
        mfaSecret: 'mock-secret',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('mfaRequired', true);
      expect(result).toHaveProperty('userId');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const token = 'valid-token';
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerificationToken: token,
        emailVerified: false,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        emailVerified: true,
        emailVerificationToken: null,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.verifyEmail(token);

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const user = {
        id: 'user-123',
        email: 'test@example.com',
      };
      const tokenRecord = {
        id: 'token-123',
        token: refreshToken,
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user,
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(tokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue(tokenRecord);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const tokenRecord = {
        id: 'token-123',
        token: 'expired-token',
        revoked: false,
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'user-123', email: 'test@example.com' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(tokenRecord);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewSecurePass123!';
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerificationToken: token,
        deletedAt: null,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue(user);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.resetPassword(token, newPassword);

      expect(result.message).toBe('Password reset successfully');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setupMFA', () => {
    it('should successfully setup MFA and return secret and QR code', async () => {
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        mfaSecret: 'BASE32SECRET',
      });

      const result = await service.setupMFA(userId);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { mfaSecret: expect.any(String) },
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.setupMFA('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if MFA already enabled', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'existing-secret',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.setupMFA('user-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyMFA', () => {
    it('should successfully verify MFA code and enable MFA', async () => {
      const userId = 'user-123';
      const token = '123456';
      const user = {
        id: userId,
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        mfaEnabled: true,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.verifyMFA(userId, token);

      expect(result.message).toBe('MFA enabled successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { mfaEnabled: true },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          action: 'MFA_ENABLED',
          entityType: 'User',
          entityId: user.id,
          ipAddress: '127.0.0.1',
          metadata: { email: user.email },
        },
      });
    });

    it('should throw BadRequestException if MFA setup not initiated', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.verifyMFA('user-123', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid MFA code', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification to return false
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(false);

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.verifyMFA('user-123', 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disableMFA', () => {
    it('should successfully disable MFA with valid code', async () => {
      const userId = 'user-123';
      const token = '123456';
      const user = {
        id: userId,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        mfaEnabled: false,
        mfaSecret: null,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.disableMFA(userId, token);

      expect(result.message).toBe('MFA disabled successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          action: 'MFA_DISABLED',
          entityType: 'User',
          entityId: user.id,
          ipAddress: '127.0.0.1',
          metadata: { email: user.email },
        },
      });
    });

    it('should throw BadRequestException if MFA not enabled', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.disableMFA('user-123', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid MFA code', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification to return false
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(false);

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.disableMFA('user-123', 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateMFALogin', () => {
    it('should successfully validate MFA code during login', async () => {
      const userId = 'user-123';
      const token = '123456';
      const user = {
        id: userId,
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateMFALogin(userId, token);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateMFALogin('nonexistent', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if MFA not enabled', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.validateMFALogin('user-123', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid MFA code', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
        mfaSecret: 'BASE32SECRET',
      };

      // Mock speakeasy verification to return false
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(false);

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.validateMFALogin('user-123', 'invalid'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
