import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  createMockUserFactory,
  createUserDtoFactory,
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
    remove: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new user', async () => {
      // ARRANGE
      const createUserDto = createUserDtoFactory();
      const mockUser = createMockUserFactory({
        name: createUserDto.name,
        email: createUserDto.email,
      });

      usersService.create.mockResolvedValue(mockUser);

      // ACT
      const result = await controller.create(createUserDto);

      // ASSERT
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll()', () => {
    it('should return paginated users', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockUser = createMockUserFactory();
      const paginatedResponse = {
        items: [mockUser],
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
      expect(result.meta.totalItems).toBe(1);
    });

    it('should return paginated users with default pagination', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {};

      const mockUser = createMockUserFactory();
      const paginatedResponse = {
        items: [mockUser],
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
    it('should return a user by id', async () => {
      // ARRANGE
      const userId = 1;
      const mockUser = createMockUserFactory({ id: userId });

      usersService.findOne.mockResolvedValue(mockUser);

      // ACT
      const result = await controller.findOne(userId);

      // ASSERT
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(result.id).toBe(userId);
    });
  });

  describe('update()', () => {
    it('should update a user', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory();
      const mockUser = createMockUserFactory({ id: userId });
      const updatedUser = createMockUserFactory({
        ...mockUser,
        ...updateUserDto,
      });

      usersService.update.mockResolvedValue(updatedUser);

      // ACT
      const result = await controller.update(userId, updateUserDto);

      // ASSERT
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
      expect(result.name).toBe(updateUserDto.name);
      expect(result.email).toBe(updateUserDto.email);
    });

    it('should update user with partial data', async () => {
      // ARRANGE
      const userId = 1;
      const updateUserDto = updateUserDtoFactory({ email: undefined });
      const mockUser = createMockUserFactory({ id: userId });
      const updatedUser = createMockUserFactory({
        ...mockUser,
        name: updateUserDto.name,
      });

      usersService.update.mockResolvedValue(updatedUser);

      // ACT
      const result = await controller.update(userId, updateUserDto);

      // ASSERT
      expect(usersService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(result.name).toBe(updateUserDto.name);
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
