import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  createMockUserResponseFactory,
  createUserDtoFactory,
  updatePasswordDtoFactory,
  updateUserDtoFactory,
} from '../../test/factories/user.factory';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    updatePassword: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updatePassword: jest.fn(),
      remove: jest.fn(),
    };

    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new user without password in response', async () => {
      // ARRANGE
      const createUserDto = createUserDtoFactory();
      const mockUserResponse = createMockUserResponseFactory({
        name: createUserDto.name,
        email: createUserDto.email,
      });

      usersService.create.mockResolvedValue(mockUserResponse);

      // ACT
      const result = await controller.create(createUserDto);

      // ASSERT
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findAll()', () => {
    it('should return paginated users without password', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockUserResponse = createMockUserResponseFactory();
      const paginatedResponse = {
        items: [mockUserResponse],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      usersService.findAll.mockResolvedValue(paginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(usersService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).not.toHaveProperty('password');
      expect(result.meta.totalItems).toBe(1);
    });

    it('should return paginated users with default pagination', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {};

      const mockUserResponse = createMockUserResponseFactory();
      const paginatedResponse = {
        items: [mockUserResponse],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      usersService.findAll.mockResolvedValue(paginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(usersService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(paginatedResponse);
    });

    it('should return empty list when no users exist', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const emptyPaginatedResponse = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      usersService.findAll.mockResolvedValue(emptyPaginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(usersService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.items).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('findOne()', () => {
    it('should return a user by id without password', async () => {
      // ARRANGE
      const userId = 1;
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      usersService.findOne.mockResolvedValue(mockUserResponse);

      // ACT
      const result = await controller.findOne(userId);

      // ASSERT
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserResponse);
      expect(result.id).toBe(userId);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update()', () => {
    it('should update a user without password in response', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory();
      const mockUserResponse = createMockUserResponseFactory({ id: userId });
      const updatedUserResponse = createMockUserResponseFactory({
        ...mockUserResponse,
        ...updateUserDto,
      });

      usersService.update.mockResolvedValue(updatedUserResponse);

      // ACT
      const result = await controller.update(userId, updateUserDto);

      // ASSERT
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUserResponse);
      expect(result.name).toBe(updateUserDto.name);
      expect(result.email).toBe(updateUserDto.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should update user with partial data', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory({ email: undefined });
      const mockUserResponse = createMockUserResponseFactory({ id: userId });
      const updatedUserResponse = createMockUserResponseFactory({
        ...mockUserResponse,
        name: updateUserDto.name,
      });

      usersService.update.mockResolvedValue(updatedUserResponse);

      // ACT
      const result = await controller.update(userId, updateUserDto);

      // ASSERT
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(updatedUserResponse);
      expect(result.name).toBe(updateUserDto.name);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updatePassword()', () => {
    it('should update user password successfully', async () => {
      // ARRANGE
      const userId = 1;
      const updatePasswordDto = updatePasswordDtoFactory();
      const mockUserResponse = createMockUserResponseFactory({ id: userId });

      usersService.updatePassword.mockResolvedValue(mockUserResponse);

      // ACT
      const result = await controller.updatePassword(userId, updatePasswordDto);

      // ASSERT
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        userId,
        updatePasswordDto,
      );
      expect(usersService.updatePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('remove()', () => {
    it('should remove a user', async () => {
      // ARRANGE
      const userId = 1;

      usersService.remove.mockResolvedValue(undefined);

      // ACT
      const result = await controller.remove(userId);

      // ASSERT
      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
