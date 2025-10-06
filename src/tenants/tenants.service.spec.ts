import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockTenantFactory,
  createTenantDtoFactory,
  updateTenantDtoFactory,
} from '../../test/factories/tenant.factory';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { validationMessages } from '../common/messages/validation-messages';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let tenantsService: TenantsService;
  let prismaService: PrismaService & {
    tenant: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const prismaMock = {
      tenant: {
        findUnique: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.findUnique
        >,
        findMany: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.findMany
        >,
        create: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.create
        >,
        update: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.update
        >,
        delete: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.delete
        >,
        count: jest.fn() as jest.MockedFunction<
          typeof prismaService.tenant.count
        >,
      },
      $transaction: jest.fn() as jest.MockedFunction<
        typeof prismaService.$transaction
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    tenantsService = module.get<TenantsService>(TenantsService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(tenantsService).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new tenant successfully', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory();
      const mockTenant = createMockTenantFactory({
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        document: createTenantDto.document,
      });

      prismaService.tenant.findUnique.mockResolvedValue(null);
      prismaService.tenant.create.mockResolvedValue(mockTenant);

      // ACT
      const result = await tenantsService.create(createTenantDto);

      // ASSERT
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: createTenantDto.slug },
      });

      expect(prismaService.tenant.create).toHaveBeenCalledWith({
        data: {
          name: createTenantDto.name,
          slug: createTenantDto.slug,
          document: createTenantDto.document,
          isActive: createTenantDto.isActive ?? true,
        },
      });

      expect(result).toBeInstanceOf(Object);
      expect(result.name).toBe(createTenantDto.name);
      expect(result.slug).toBe(createTenantDto.slug);
      expect(result.document).toBe(createTenantDto.document);
    });

    it('should throw ConflictException if slug already exists', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory();
      const existingTenant = createMockTenantFactory({
        id: 2,
        slug: createTenantDto.slug,
      });

      prismaService.tenant.findUnique.mockResolvedValue(existingTenant);

      // ACT & ASSERT
      await expect(tenantsService.create(createTenantDto)).rejects.toThrow(
        validationMessages.TENANT.SLUG_ALREADY_IN_USE(createTenantDto.slug),
      );

      expect(prismaService.tenant.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if document already exists', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory();
      const existingTenant = createMockTenantFactory({
        id: 2,
        document: createTenantDto.document,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.findUnique.mockResolvedValueOnce(existingTenant);

      // ACT & ASSERT
      await expect(tenantsService.create(createTenantDto)).rejects.toThrow(
        validationMessages.TENANT.DOCUMENT_ALREADY_IN_USE(
          createTenantDto.document!,
        ),
      );

      expect(prismaService.tenant.create).not.toHaveBeenCalled();
    });

    it('should create tenant without document', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory({ document: undefined });
      const mockTenant = createMockTenantFactory({
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        document: null,
      });

      prismaService.tenant.findUnique.mockResolvedValue(null);
      prismaService.tenant.create.mockResolvedValue(mockTenant);

      // ACT
      const result = await tenantsService.create(createTenantDto);

      // ASSERT
      expect(prismaService.tenant.create).toHaveBeenCalled();
      expect(result.document).toBeNull();
    });

    it('should throw if prisma.create throws an error', async () => {
      // ARRANGE
      const createTenantDto = createTenantDtoFactory();

      prismaService.tenant.findUnique.mockResolvedValue(null);
      prismaService.tenant.create.mockRejectedValue(new Error('DB error'));

      // ACT & ASSERT
      await expect(tenantsService.create(createTenantDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findAll()', () => {
    it('should return paginated tenants', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockTenants = [createMockTenantFactory()];
      const totalItems = 1;

      prismaService.$transaction.mockResolvedValueOnce([
        mockTenants,
        totalItems,
      ]);

      // ACT
      const result = await tenantsService.findAll(paginationDto);

      // ASSERT
      expect(prismaService.$transaction).toHaveBeenCalled();

      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        items: mockTenants.map(() => expect.any(Object)),
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });
    });

    it('should use default pagination values when not provided', async () => {
      // ARRANGE
      const mockTenants = [createMockTenantFactory()];
      const totalItems = 1;

      prismaService.$transaction.mockResolvedValueOnce([
        mockTenants,
        totalItems,
      ]);

      // ACT
      const result = await tenantsService.findAll({});

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
      const mockTenants = Array(10)
        .fill(null)
        .map((_, i) => createMockTenantFactory({ id: i + 1 }));
      const totalItems = 25;

      prismaService.$transaction.mockResolvedValueOnce([
        mockTenants,
        totalItems,
      ]);

      // ACT
      const result = await tenantsService.findAll({ page: 2, limit: 10 });

      // ASSERT
      expect(result.meta).toEqual({
        totalItems: 25,
        itemCount: 10,
        itemsPerPage: 10,
        totalPages: 3,
        currentPage: 2,
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
      await expect(tenantsService.findAll(paginationDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findOne()', () => {
    it('should return a tenant by id', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({ id: tenantId });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);

      // ACT
      const result = await tenantsService.findOne(tenantId);

      // ASSERT
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
      });

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(tenantId);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      // ARRANGE
      const tenantId = 999;

      prismaService.tenant.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(tenantsService.findOne(tenantId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(tenantsService.findOne(tenantId)).rejects.toThrow(
        validationMessages.TENANT.NOT_FOUND(tenantId),
      );
    });

    it('should throw if prisma throws error', async () => {
      // ARRANGE
      const tenantId = 1;

      prismaService.tenant.findUnique.mockRejectedValueOnce(
        new Error('DB error'),
      );

      // ACT & ASSERT
      await expect(tenantsService.findOne(tenantId)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('update()', () => {
    it('should update a tenant successfully', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory();
      const mockTenant = createMockTenantFactory({ id: tenantId });
      const updatedTenant = createMockTenantFactory({
        ...mockTenant,
        ...updateTenantDto,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.update.mockResolvedValueOnce(updatedTenant);

      // ACT
      const result = await tenantsService.update(tenantId, updateTenantDto);

      // ASSERT
      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: updateTenantDto,
      });

      expect(result).toBeInstanceOf(Object);
      expect(result.name).toBe(updateTenantDto.name);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      // ARRANGE
      const tenantId = 999;
      const updateTenantDto = updateTenantDtoFactory();

      prismaService.tenant.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(
        tenantsService.update(tenantId, updateTenantDto),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.tenant.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists for another tenant', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory();
      const mockTenant = createMockTenantFactory({ id: tenantId });
      const anotherTenant = createMockTenantFactory({
        id: 2,
        slug: updateTenantDto.slug,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(anotherTenant);

      // ACT & ASSERT
      await expect(
        tenantsService.update(tenantId, updateTenantDto),
      ).rejects.toThrow(ConflictException);

      expect(prismaService.tenant.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if document already exists for another tenant', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory();
      const mockTenant = createMockTenantFactory({ id: tenantId });
      const anotherTenant = createMockTenantFactory({
        id: 2,
        document: updateTenantDto.document,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.findUnique.mockResolvedValueOnce(anotherTenant);

      // ACT & ASSERT
      await expect(
        tenantsService.update(tenantId, updateTenantDto),
      ).rejects.toThrow(ConflictException);

      expect(prismaService.tenant.update).not.toHaveBeenCalled();
    });

    it('should allow updating with same slug', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({ id: tenantId });
      const updateTenantDto = updateTenantDtoFactory({
        slug: mockTenant.slug,
      });
      const updatedTenant = createMockTenantFactory({
        ...mockTenant,
        name: updateTenantDto.name,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.update.mockResolvedValueOnce(updatedTenant);

      // ACT
      const result = await tenantsService.update(tenantId, updateTenantDto);

      // ASSERT
      expect(prismaService.tenant.update).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Object);
    });

    it('should update without slug validation if slug not provided', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({ id: tenantId });
      const updateTenantDto = updateTenantDtoFactory({ slug: undefined });
      const updatedTenant = createMockTenantFactory({
        ...mockTenant,
        name: updateTenantDto.name,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.update.mockResolvedValueOnce(updatedTenant);

      // ACT
      const result = await tenantsService.update(tenantId, updateTenantDto);

      // ASSERT
      expect(prismaService.tenant.update).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Object);
    });

    it('should throw if prisma.update throws an error', async () => {
      // ARRANGE
      const tenantId = 1;
      const updateTenantDto = updateTenantDtoFactory();
      const mockTenant = createMockTenantFactory({ id: tenantId });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.findUnique.mockResolvedValueOnce(null);
      prismaService.tenant.update.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(
        tenantsService.update(tenantId, updateTenantDto),
      ).rejects.toThrow('DB error');
    });
  });

  describe('remove()', () => {
    it('should delete a tenant successfully', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({ id: tenantId });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.delete.mockResolvedValueOnce(mockTenant);

      // ACT
      const result = await tenantsService.remove(tenantId);

      // ASSERT
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
      });

      expect(prismaService.tenant.delete).toHaveBeenCalledWith({
        where: { id: tenantId },
      });

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(tenantId);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      // ARRANGE
      const tenantId = 999;

      prismaService.tenant.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(tenantsService.remove(tenantId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.tenant.delete).not.toHaveBeenCalled();
    });

    it('should throw if prisma.delete throws an error', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({ id: tenantId });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.delete.mockRejectedValueOnce(new Error('DB error'));

      // ACT & ASSERT
      await expect(tenantsService.remove(tenantId)).rejects.toThrow('DB error');
    });
  });

  describe('toggleActive()', () => {
    it('should toggle tenant status from active to inactive', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({
        id: tenantId,
        isActive: true,
      });
      const updatedTenant = createMockTenantFactory({
        ...mockTenant,
        isActive: false,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.update.mockResolvedValueOnce(updatedTenant);

      // ACT
      const result = await tenantsService.toggleActive(tenantId);

      // ASSERT
      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });

    it('should toggle tenant status from inactive to active', async () => {
      // ARRANGE
      const tenantId = 1;
      const mockTenant = createMockTenantFactory({
        id: tenantId,
        isActive: false,
      });
      const updatedTenant = createMockTenantFactory({
        ...mockTenant,
        isActive: true,
      });

      prismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      prismaService.tenant.update.mockResolvedValueOnce(updatedTenant);

      // ACT
      const result = await tenantsService.toggleActive(tenantId);

      // ASSERT
      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: { isActive: true },
      });

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      // ARRANGE
      const tenantId = 999;

      prismaService.tenant.findUnique.mockResolvedValueOnce(null);

      // ACT & ASSERT
      await expect(tenantsService.toggleActive(tenantId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaService.tenant.update).not.toHaveBeenCalled();
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
        createMockTenantFactory({ id: 1, isActive: true }),
        createMockTenantFactory({ id: 2, isActive: true }),
      ];
      const totalItems = 2;

      prismaService.$transaction.mockResolvedValueOnce([
        mockActiveTenants,
        totalItems,
      ]);

      // ACT
      const result = await tenantsService.findActive(paginationDto);

      // ASSERT
      expect(prismaService.$transaction).toHaveBeenCalled();

      expect(result.items).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
      result.items.forEach((tenant) => {
        expect(tenant.isActive).toBe(true);
      });
    });

    it('should return empty list when no active tenants exist', async () => {
      // ARRANGE
      const paginationDto: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      prismaService.$transaction.mockResolvedValueOnce([[], 0]);

      // ACT
      const result = await tenantsService.findActive(paginationDto);

      // ASSERT
      expect(result.items).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });
});
