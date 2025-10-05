import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockUserFactory,
  createMockUserResponseFactory,
  createUserDtoFactory,
  updatePasswordDtoFactory,
  updateUserDtoFactory,
} from '../../test/factories/user.factory';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { validationMessages } from '../common/messages/validation-messages';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../services/bcrypt.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService & {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let bcryptService: BcryptService & {
    hashPassword: jest.Mock;
    comparePasswords: jest.Mock;
  };

  const userSelect = {
    id: true,
    email: true,
    name: true,
    isAdmin: true,
    createdAt: true,
    updatedAt: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const prismaMock = {
      user: {
        findUnique: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.findUnique
        >,
        findMany: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.findMany
        >,
        create: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.create
        >,
        update: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.update
        >,
        delete: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.delete
        >,
        count: jest.fn() as jest.MockedFunction<
          typeof prismaService.user.count
        >,
      },
      $transaction: jest.fn() as jest.MockedFunction<
        typeof prismaService.$transaction
      >,
    };

    const bcryptMock = {
      hashPassword: jest.fn(),
      comparePasswords: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BcryptService, useValue: bcryptMock },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    bcryptService = module.get(BcryptService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new user successfully', async () => {
      // ARRANGE
      const createUserDto = createUserDtoFactory();
      const hashedPassword = 'hashed_password_123';
      const mockUserResponse = createMockUserResponseFactory({
        name: createUserDto.name,
        email: createUserDto.email,
      });

      prismaService.user.findUnique.mockResolvedValueOnce(null);
      bcryptService.hashPassword = jest
        .fn()
        .mockResolvedValueOnce(hashedPassword);
      prismaService.user.create.mockResolvedValueOnce(mockUserResponse);

      // ACT
      const result = await usersService.create(createUserDto);

      // ASSERT
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });

      expect(bcryptService.hashPassword).toHaveBeenCalledWith(
        createUserDto.password,
      );

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: userSelect,
      });

      expect(result).toEqual(mockUserResponse);
      expect(result).toHaveProperty('email', createUserDto.email);
      expect(result).toHaveProperty('name', createUserDto.name);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      // ARRANGE
      const createUserDto = createUserDtoFactory();
      const existingUser = createMockUserFactory({
        id: 2,
        email: createUserDto.email,
      });

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      // ACT & ASSERT
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        validationMessages.EMAIL.ALREADY_IN_USE,
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw if prisma.create throws an error', async () => {
      // ARRANGE
      const createUserDto = createUserDtoFactory();

      prismaService.user.findUnique.mockResolvedValueOnce(null);
      prismaService.user.create.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(usersService.create(createUserDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findAll()', () => {
    it('should return paginated users without password', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockUsers = [createMockUserResponseFactory()];
      const totalItems = 1;

      prismaService.$transaction.mockResolvedValueOnce([mockUsers, totalItems]);

      // ACT
      const result = await usersService.findAll(paginationDto);

      // ASSERT
      expect(prismaService.$transaction).toHaveBeenCalled();

      expect(result).toEqual({
        items: mockUsers,
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });

      expect(result.items[0]).not.toHaveProperty('password');
    });

    it('should use default pagination values when not provided', async () => {
      // ARRANGE
      const mockUsers = [createMockUserResponseFactory()];
      const totalItems = 1;

      prismaService.$transaction.mockResolvedValueOnce([mockUsers, totalItems]);

      // ACT
      const result = await usersService.findAll({});

      // ASSERT
      expect(prismaService.$transaction).toHaveBeenCalled();

      expect(result.meta).toEqual({
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      });
    });

    it('should calculate correct pagination metadata for multiple pages', async () => {
      // ARRANGE
      const mockUsers = Array(10)
        .fill(null)
        .map((_, i) => createMockUserResponseFactory({ id: i + 1 }));
      const totalItems = 25;

      prismaService.$transaction.mockResolvedValueOnce([mockUsers, totalItems]);

      // ACT
      const result = await usersService.findAll({ page: 2, limit: 10 });

      // ASSERT
      expect(result.meta).toEqual({
        totalItems: 25,
        itemCount: 10,
        itemsPerPage: 10,
        totalPages: 3,
        currentPage: 2,
      });
    });

    it('should handle last page with fewer items correctly', async () => {
      // ARRANGE
      const mockUsers = Array(5)
        .fill(null)
        .map((_, i) => createMockUserResponseFactory({ id: i + 21 }));
      const totalItems = 25;

      prismaService.$transaction.mockResolvedValueOnce([mockUsers, totalItems]);

      // ACT
      const result = await usersService.findAll({ page: 3, limit: 10 });

      // ASSERT
      expect(result.meta).toEqual({
        totalItems: 25,
        itemCount: 5,
        itemsPerPage: 10,
        totalPages: 3,
        currentPage: 3,
      });
    });

    it('should throw if prisma.$transaction throws an error', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      prismaService.$transaction.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(usersService.findAll(paginationDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findOne()', () => {
    it('should return a user by id without password', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);

      // ACT
      const result = await usersService.findOne(userId);

      // ASSERT
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: userSelect,
      });

      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      // ARRANGE
      const userId = 999;

      prismaService.user.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(usersService.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(usersService.findOne(userId)).rejects.toThrow(
        validationMessages.USER.NOT_FOUND(userId),
      );
    });

    it('should throw if prisma throws error', async () => {
      // ARRANGE
      const userId = 1;

      prismaService.user.findUnique.mockRejectedValueOnce(
        new Error('DB error'),
      );

      // ACT & ASSERT
      await expect(usersService.findOne(userId)).rejects.toThrow('DB error');
    });
  });

  describe('update()', () => {
    it('should update a user successfully without returning password', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory();
      const mockUserResponse = createMockUserResponseFactory({ id: userId });
      const updatedUserResponse = createMockUserResponseFactory({
        ...mockUserResponse,
        ...updateUserDto,
      });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.findUnique.mockResolvedValueOnce(null);
      prismaService.user.update.mockResolvedValueOnce(updatedUserResponse);

      // ACT
      const result = await usersService.update(userId, updateUserDto);

      // ASSERT
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
        select: userSelect,
      });

      expect(result).toEqual(updatedUserResponse);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // ARRANGE
      const userId = 999;
      const updateUserDto = updateUserDtoFactory();

      prismaService.user.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(usersService.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists for another user', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory();
      const mockUser = createMockUserFactory({ id: userId });
      const anotherUser = createMockUserFactory({
        id: 2,
        email: updateUserDto.email,
      });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      prismaService.user.findUnique.mockResolvedValueOnce(anotherUser);

      // ACT & ASSERT
      await expect(usersService.update(userId, updateUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should allow updating with same email', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });
      const updateUserDto = updateUserDtoFactory({
        name: 'Updated Name',
        email: mockUserResponse.email,
      });
      const updatedUserResponse = createMockUserResponseFactory({
        ...mockUserResponse,
        name: 'Updated Name',
      });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.findUnique.mockResolvedValueOnce(
        createMockUserFactory({
          id: userId,
          email: mockUserResponse.email,
        }),
      );
      prismaService.user.update.mockResolvedValueOnce(updatedUserResponse);

      // ACT
      const result = await usersService.update(userId, updateUserDto);

      // ASSERT
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUserResponse);
    });

    it('should update without email validation if email not provided', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });
      const updateUserDto = updateUserDtoFactory({ email: undefined });
      const updatedUserResponse = createMockUserResponseFactory({
        ...mockUserResponse,
        name: updateUserDto.name,
      });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.update.mockResolvedValueOnce(updatedUserResponse);

      // ACT
      const result = await usersService.update(userId, updateUserDto);

      // ASSERT
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUserResponse);
    });

    it('should throw if prisma.update throws an error', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory();
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.findUnique.mockResolvedValueOnce(null);
      prismaService.user.update.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(usersService.update(userId, updateUserDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('remove()', () => {
    it('should delete a user successfully without returning password', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.delete.mockResolvedValueOnce(mockUserResponse);

      // ACT
      const result = await usersService.remove(userId);

      // ASSERT
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: userSelect,
      });

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        select: userSelect,
      });

      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // ARRANGE
      const userId = 999;

      prismaService.user.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(usersService.remove(userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });

    it('should throw if prisma.delete throws an error', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUserResponse);
      prismaService.user.delete.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(usersService.remove(userId)).rejects.toThrow('DB error');
    });
  });

  describe('updatePassword()', () => {
    it('should update password successfully', async () => {
      // ARRANGE
      const userId = 1;
      const updatePasswordDto = updatePasswordDtoFactory();
      const mockUser = createMockUserFactory({ id: userId });
      const hashedPassword = 'new_hashed_password';
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      bcryptService.comparePasswords = jest.fn().mockResolvedValueOnce(true);
      bcryptService.hashPassword = jest
        .fn()
        .mockResolvedValueOnce(hashedPassword);
      prismaService.user.update.mockResolvedValueOnce(mockUserResponse);

      // ACT
      const result = await usersService.updatePassword(
        userId,
        updatePasswordDto,
      );

      // ASSERT
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(bcryptService.comparePasswords).toHaveBeenCalledWith(
        updatePasswordDto.currentPassword,
        mockUser.password,
      );

      expect(bcryptService.hashPassword).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword },
        select: userSelect,
      });

      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      // ARRANGE
      const userId = 999;
      const updatePasswordDto = updatePasswordDtoFactory();

      prismaService.user.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(validationMessages.USER.NOT_FOUND(userId));

      const comparePasswordsMock = bcryptService.comparePasswords as jest.Mock;
      expect(comparePasswordsMock).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      // ARRANGE
      const userId = 1;
      const updatePasswordDto = updatePasswordDtoFactory({
        newPasswordConfirm: 'DifferentPassword123!',
      });
      const mockUser = createMockUserFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // ACT & ASSERT
      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow('As senhas não coincidem');

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      // ARRANGE
      const userId = 1;
      const updatePasswordDto = updatePasswordDtoFactory();
      const mockUser = createMockUserFactory({ id: userId });

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      bcryptService.comparePasswords = jest.fn().mockResolvedValue(false);

      // ACT & ASSERT
      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException);

      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow('Senha atual incorreta');

      expect(bcryptService.comparePasswords).toHaveBeenCalledWith(
        updatePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw if prisma.update throws an error', async () => {
      // ARRANGE
      const userId = 1;
      const updatePasswordDto = updatePasswordDtoFactory();
      const mockUser = createMockUserFactory({ id: userId });
      const hashedPassword = 'new_hashed_password';

      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      bcryptService.comparePasswords = jest.fn().mockResolvedValueOnce(true);
      bcryptService.hashPassword = jest
        .fn()
        .mockResolvedValueOnce(hashedPassword);
      prismaService.user.update.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(
        usersService.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow('DB error');
    });
  });
});
