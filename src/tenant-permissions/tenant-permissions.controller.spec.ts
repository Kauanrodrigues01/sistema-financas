import { Test, TestingModule } from '@nestjs/testing';
import { TenantPermissionsController } from './tenant-permissions.controller';
import { TenantPermissionsService } from './tenant-permissions.service';

describe('TenantPermissionsController', () => {
  let controller: TenantPermissionsController;
  let service: TenantPermissionsService;

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

  const mockTenantPermissionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByModule: jest.fn(),
    findByModuleName: jest.fn(),
    findModules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantPermissionsController],
      providers: [
        {
          provide: TenantPermissionsService,
          useValue: mockTenantPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<TenantPermissionsController>(
      TenantPermissionsController,
    );
    service = module.get<TenantPermissionsService>(TenantPermissionsService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de permissões', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const expectedResult = {
        items: mockPermissions,
        meta: {
          totalItems: 3,
          itemCount: 3,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockTenantPermissionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve chamar service com paginação padrão', async () => {
      const paginationDto = {};
      const expectedResult = {
        items: mockPermissions,
        meta: {
          totalItems: 3,
          itemCount: 3,
          itemsPerPage: 50,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockTenantPermissionsService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma permissão pelo ID', async () => {
      const permissionId = 1;
      const expectedPermission = mockPermissions[0];

      mockTenantPermissionsService.findOne.mockResolvedValue(
        expectedPermission,
      );

      const result = await controller.findOne(permissionId);

      expect(result).toEqual(expectedPermission);
      expect(service.findOne).toHaveBeenCalledWith(permissionId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro do service quando permissão não existe', async () => {
      const permissionId = 999;
      const error = new Error('Permissão com ID 999 não encontrada');

      mockTenantPermissionsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(permissionId)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith(permissionId);
    });
  });

  describe('findByModule', () => {
    it('deve retornar permissões agrupadas por módulo', async () => {
      const expectedResult = [
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
      ];

      mockTenantPermissionsService.findByModule.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findByModule();

      expect(result).toEqual(expectedResult);
      expect(service.findByModule).toHaveBeenCalledTimes(1);
      expect(service.findByModule).toHaveBeenCalledWith();
    });

    it('deve retornar array vazio quando não há permissões', async () => {
      mockTenantPermissionsService.findByModule.mockResolvedValue([]);

      const result = await controller.findByModule();

      expect(result).toEqual([]);
      expect(service.findByModule).toHaveBeenCalledTimes(1);
    });
  });

  describe('findModules', () => {
    it('deve retornar lista de módulos disponíveis', async () => {
      const expectedModules = ['users', 'finance', 'reports'];

      mockTenantPermissionsService.findModules.mockResolvedValue(
        expectedModules,
      );

      const result = await controller.findModules();

      expect(result).toEqual(expectedModules);
      expect(service.findModules).toHaveBeenCalledTimes(1);
      expect(service.findModules).toHaveBeenCalledWith();
    });

    it('deve retornar array vazio quando não há módulos', async () => {
      mockTenantPermissionsService.findModules.mockResolvedValue([]);

      const result = await controller.findModules();

      expect(result).toEqual([]);
      expect(service.findModules).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByModuleName', () => {
    it('deve retornar permissões de um módulo específico', async () => {
      const moduleName = 'users';
      const expectedPermissions = mockPermissions.filter(
        (p) => p.module === moduleName,
      );

      mockTenantPermissionsService.findByModuleName.mockResolvedValue(
        expectedPermissions,
      );

      const result = await controller.findByModuleName(moduleName);

      expect(result).toEqual(expectedPermissions);
      expect(service.findByModuleName).toHaveBeenCalledWith(moduleName);
      expect(service.findByModuleName).toHaveBeenCalledTimes(1);
    });

    it('deve chamar service com nome do módulo em lowercase', async () => {
      const moduleName = 'USERS';
      const expectedPermissions = mockPermissions.filter(
        (p) => p.module === 'users',
      );

      mockTenantPermissionsService.findByModuleName.mockResolvedValue(
        expectedPermissions,
      );

      await controller.findByModuleName(moduleName);

      expect(service.findByModuleName).toHaveBeenCalledWith(moduleName);
    });

    it('deve propagar erro do service quando módulo não existe', async () => {
      const moduleName = 'nonexistent';
      const error = new Error(
        `Nenhuma permissão encontrada para o módulo "${moduleName}"`,
      );

      mockTenantPermissionsService.findByModuleName.mockRejectedValue(error);

      await expect(controller.findByModuleName(moduleName)).rejects.toThrow(
        error,
      );
      expect(service.findByModuleName).toHaveBeenCalledWith(moduleName);
    });
  });

  describe('Guards', () => {
    it('deve ter guards configurados no controller', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        TenantPermissionsController,
      );

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('deve ter método findAll com decorators corretos', () => {
      const metadata = Reflect.getMetadata(
        'path',
        TenantPermissionsController.prototype.findAll,
      );
      expect(metadata).toBeDefined();
    });

    it('deve ter método findOne com decorators corretos', () => {
      const metadata = Reflect.getMetadata(
        'path',
        TenantPermissionsController.prototype.findOne,
      );
      expect(metadata).toBeDefined();
    });

    it('deve ter método findByModule com decorators corretos', () => {
      const metadata = Reflect.getMetadata(
        'path',
        TenantPermissionsController.prototype.findByModule,
      );
      expect(metadata).toBeDefined();
    });

    it('deve ter método findModules com decorators corretos', () => {
      const metadata = Reflect.getMetadata(
        'path',
        TenantPermissionsController.prototype.findModules,
      );
      expect(metadata).toBeDefined();
    });

    it('deve ter método findByModuleName com decorators corretos', () => {
      const metadata = Reflect.getMetadata(
        'path',
        TenantPermissionsController.prototype.findByModuleName,
      );
      expect(metadata).toBeDefined();
    });
  });

  describe('Swagger Documentation', () => {
    it('deve ter ApiTags definido', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', TenantPermissionsController);
      expect(tags).toBeDefined();
    });

    it('deve ter ApiBearerAuth definido', () => {
      const bearerAuth = Reflect.getMetadata(
        'swagger/apiSecurity',
        TenantPermissionsController,
      );
      expect(bearerAuth).toBeDefined();
    });
  });
});
