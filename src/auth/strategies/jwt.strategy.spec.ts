import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validationMessages } from 'src/common/messages/validation-messages';
import { PrismaService } from 'src/prisma/prisma.service';
import { createMockUserFactory } from 'test/factories/user.factory';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService & {
    user: { findUnique: jest.Mock };
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = {
      sub: 1,
      email: 'john.doe@example.com',
    };

    it('should return user data when user exists', async () => {
      const mockUser = createMockUserFactory();
      const expectedUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        isAdmin: mockUser.isAdmin,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException(validationMessages.AUTH.USER_NOT_FOUND),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
        },
      });
    });

    it('should return admin user when isAdmin is true', async () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        isAdmin: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);

      const result = await strategy.validate(payload);

      expect(result.isAdmin).toBe(true);
    });
  });
});
