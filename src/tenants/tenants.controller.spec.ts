import {
  createMockTenantResponseFactory,
  createTenantDtoFactory,
  updateTenantDtoFactory,
} from '../../test/factories/tenant.factory';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findActive: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    toggleActive: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    tenantsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      toggleActive: jest.fn(),
      remove: jest.fn(),
    };

    controller = new TenantsController(
      tenantsService as unknown as TenantsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new tenant', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory();
      const mockTenantResponse = createMockTenantResponseFactory({
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        document: createTenantDto.document,
      });

      tenantsService.create.mockResolvedValue(mockTenantResponse);

      // ACT
      const result = await controller.create(createTenantDto);

      // ASSERT
      expect(tenantsService.create).toHaveBeenCalledWith(createTenantDto);
      expect(tenantsService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTenantResponse);
      expect(result.name).toBe(createTenantDto.name);
      expect(result.slug).toBe(createTenantDto.slug);
    });
  });

  describe('findAll()', () => {
    it('should return paginated tenants', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockTenantResponse = createMockTenantResponseFactory();
      const paginatedResponse = {
        items: [mockTenantResponse],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      tenantsService.findAll.mockResolvedValue(paginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(tenantsService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(tenantsService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedResponse);
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should return paginated tenants with default pagination', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {};

      const mockTenantResponse = createMockTenantResponseFactory();
      const paginatedResponse = {
        items: [mockTenantResponse],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      tenantsService.findAll.mockResolvedValue(paginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(tenantsService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(paginatedResponse);
    });

    it('should return empty list when no tenants exist', async () => {
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

      tenantsService.findAll.mockResolvedValue(emptyPaginatedResponse);

      // ACT
      const result = await controller.findAll(paginationDto);

      // ASSERT
      expect(tenantsService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.items).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('findActive()', () => {
    it('should return only active tenants', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockActiveTenants = [
        createMockTenantResponseFactory({ id: 1, isActive: true }),
        createMockTenantResponseFactory({ id: 2, isActive: true }),
      ];
      const paginatedResponse = {
        items: mockActiveTenants,
        meta: {
          totalItems: 2,
          itemCount: 2,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      tenantsService.findActive.mockResolvedValue(paginatedResponse);

      // ACT
      const result = await controller.findActive(paginationDto);

      // ASSERT
      expect(tenantsService.findActive).toHaveBeenCalledWith(paginationDto);
      expect(tenantsService.findActive).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedResponse);
      expect(result.items).toHaveLength(2);
      result.items.forEach((tenant) => {
        expect(tenant.isActive).toBe(true);
      });
    });
  });

  describe('findOne()', () => {
    it('should return a tenant by id', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenantResponse = createMockTenantResponseFactory({
        id: tenantId,
      });

      tenantsService.findOne.mockResolvedValue(mockTenantResponse);

      // ACT
      const result = await controller.findOne(tenantId);

      // ASSERT
      expect(tenantsService.findOne).toHaveBeenCalledWith(tenantId);
      expect(tenantsService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTenantResponse);
      expect(result.id).toBe(tenantId);
    });
  });

  describe('update()', () => {
    it('should update a tenant', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory();
      const mockTenantResponse = createMockTenantResponseFactory({
        id: tenantId,
      });
      const updatedTenantResponse = createMockTenantResponseFactory({
        ...mockTenantResponse,
        ...updateTenantDto,
      });

      tenantsService.update.mockResolvedValue(updatedTenantResponse);

      // ACT
      const result = await controller.update(tenantId, updateTenantDto);

      // ASSERT
      expect(tenantsService.update).toHaveBeenCalledWith(
        tenantId,
        updateTenantDto,
      );
      expect(tenantsService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedTenantResponse);
      expect(result.name).toBe(updateTenantDto.name);
      expect(result.slug).toBe(updateTenantDto.slug);
    });

    it('should update tenant with partial data', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory({ slug: undefined });
      const mockTenantResponse = createMockTenantResponseFactory({
        id: tenantId,
      });
      const updatedTenantResponse = createMockTenantResponseFactory({
        ...mockTenantResponse,
        name: updateTenantDto.name,
      });

      tenantsService.update.mockResolvedValue(updatedTenantResponse);

      // ACT
      const result = await controller.update(tenantId, updateTenantDto);

      // ASSERT
      expect(tenantsService.update).toHaveBeenCalledWith(
        tenantId,
        updateTenantDto,
      );
      expect(result).toEqual(updatedTenantResponse);
      expect(result.name).toBe(updateTenantDto.name);
    });
  });

  describe('toggleActive()', () => {
    it('should toggle tenant status from active to inactive', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenantResponse = createMockTenantResponseFactory({
        id: tenantId,
        isActive: false,
      });

      tenantsService.toggleActive.mockResolvedValue(mockTenantResponse);

      // ACT
      const result = await controller.toggleActive(tenantId);

      // ASSERT
      expect(tenantsService.toggleActive).toHaveBeenCalledWith(tenantId);
      expect(tenantsService.toggleActive).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTenantResponse);
      expect(result.isActive).toBe(false);
    });

    it('should toggle tenant status from inactive to active', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenantResponse = createMockTenantResponseFactory({
        id: tenantId,
        isActive: true,
      });

      tenantsService.toggleActive.mockResolvedValue(mockTenantResponse);

      // ACT
      const result = await controller.toggleActive(tenantId);

      // ASSERT
      expect(tenantsService.toggleActive).toHaveBeenCalledWith(tenantId);
      expect(result.isActive).toBe(true);
    });
  });

  describe('remove()', () => {
    it('should remove a tenant', async () => {
      // ARRANGE
      const tenantId = 1;

      tenantsService.remove.mockResolvedValue(undefined);

      // ACT
      const result = await controller.remove(tenantId);

      // ASSERT
      expect(tenantsService.remove).toHaveBeenCalledWith(tenantId);
      expect(tenantsService.remove).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
