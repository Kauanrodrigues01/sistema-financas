import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantPermissionsService } from './tenant-permissions.service';

describe('TenantPermissionsService', () => {
  let service: TenantPermissionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPermissions = [
    {
      id: 1,
      codename: 'add_user',
      name: 'Adicionar Usuário',
      module: 'users',
      description: 'Permite criar novos usuários',
      createdAt: new Date('2025-10-05T12:00:00.000Z'),
    },
    {
      id: 2,
      codename: 'view_user',
      name: 'Visualizar Usuário',
      module: 'users',
      description: 'Permite visualizar usuários',
      createdAt: new Date('2025-10-05T12:00:00.000Z'),
    },
    {
      id: 3,
      codename: 'add_transaction',
      name: 'Adicionar Transação',
      module: 'finance',
      description: 'Permite criar transações',
      createdAt: new Date('2025-10-05T12:00:00.000Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantPermissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantPermissionsService>(TenantPermissionsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de permissões', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const totalItems = 3;

      mockPrismaService.$transaction.mockResolvedValue([
        mockPermissions,
        totalItems,
      ]);

      const result = await service.findAll(paginationDto);

      expect(result).toEqual({
        items: mockPermissions,
        meta: {
          totalItems,
          itemCount: mockPermissions.length,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve usar valores padrão de paginação quando não fornecidos', async () => {
      mockPrismaService.$transaction.mockResolvedValue([mockPermissions, 3]);

      await service.findAll({});

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve calcular corretamente o número de páginas', async () => {
      const paginationDto = { page: 1, limit: 2 };
      mockPrismaService.$transaction.mockResolvedValue([
        mockPermissions.slice(0, 2),
        3,
      ]);

      const result = await service.findAll(paginationDto);

      expect(result.meta.totalPages).toBe(2); // 3 items / 2 per page = 2 pages
    });
  });

  describe('findOne', () => {
    it('deve retornar uma permissão pelo ID', async () => {
      const permissionId = 1;
      mockPrismaService.permission.findUnique.mockResolvedValue(
        mockPermissions[0],
      );

      const result = await service.findOne(permissionId);

      expect(result).toEqual(mockPermissions[0]);
      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { id: permissionId },
        select: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException quando permissão não existe', async () => {
      const permissionId = 999;
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.findOne(permissionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(permissionId)).rejects.toThrow(
        `Permissão com ID ${permissionId} não encontrada`,
      );
    });
  });

  describe('findByModule', () => {
    it('deve retornar permissões agrupadas por módulo', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue(mockPermissions);

      const result = await service.findByModule();

      expect(result).toHaveLength(2); // 2 módulos: users e finance
      expect(result).toEqual([
        {
          module: 'users',
          count: 2,
          permissions: [mockPermissions[0], mockPermissions[1]],
        },
        {
          module: 'finance',
          count: 1,
          permissions: [mockPermissions[2]],
        },
      ]);
    });

    it('deve ordenar por módulo e nome', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue(mockPermissions);

      await service.findByModule();

      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
        select: expect.any(Object),
      });
    });

    it('deve retornar array vazio quando não há permissões', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      const result = await service.findByModule();

      expect(result).toEqual([]);
    });
  });

  describe('findByModuleName', () => {
    it('deve retornar permissões de um módulo específico', async () => {
      const moduleName = 'users';
      const usersPermissions = mockPermissions.filter(
        (p) => p.module === moduleName,
      );

      mockPrismaService.permission.findMany.mockResolvedValue(
        usersPermissions,
      );

      const result = await service.findByModuleName(moduleName);

      expect(result).toEqual(usersPermissions);
      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        where: { module: moduleName },
        orderBy: { name: 'asc' },
        select: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException quando módulo não tem permissões', async () => {
      const moduleName = 'nonexistent';
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      await expect(service.findByModuleName(moduleName)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByModuleName(moduleName)).rejects.toThrow(
        `Nenhuma permissão encontrada para o módulo "${moduleName}"`,
      );
    });
  });

  describe('findModules', () => {
    it('deve retornar lista de módulos únicos', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([
        { module: 'users' },
        { module: 'finance' },
      ]);

      const result = await service.findModules();

      expect(result).toEqual(['users', 'finance']);
      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        select: { module: true },
        distinct: ['module'],
        orderBy: { module: 'asc' },
      });
    });

    it('deve retornar array vazio quando não há módulos', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      const result = await service.findModules();

      expect(result).toEqual([]);
    });

    it('deve ordenar módulos alfabeticamente', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([
        { module: 'users' },
        { module: 'finance' },
        { module: 'reports' },
      ]);

      await service.findModules();

      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        select: { module: true },
        distinct: ['module'],
        orderBy: { module: 'asc' },
      });
    });
  });
});
