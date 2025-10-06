import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import {
  UpdatePasswordDto,
  UpdateTenantUserDto,
} from './dto/update-tenant-user.dto';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { TenantIsolationGuard } from './guards/tenant-isolation.guard';
import { TenantUserGuard } from './guards/tenant-user.guard';
import { UserTenantController } from './user-tenant.controller';
import { UserTenantService } from './user-tenant.service';

describe('UserTenantController', () => {
  let controller: UserTenantController;
  let service: UserTenantService & {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    toggleActive: jest.Mock;
    updatePassword: jest.Mock;
  };

  const mockUser: UserResponseDto = {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    isSuperAdmin: false,
    isTenantAdmin: false,
    tenantId: 1,
    isActive: true,
    tenant: {
      id: 1,
      name: 'Tenant ABC',
      slug: 'tenant-abc',
    },
    roles: [],
    permissions: [],
    createdAt: new Date('2025-10-05T12:00:00.000Z'),
    updatedAt: new Date('2025-10-05T12:00:00.000Z'),
  };

  const mockCurrentUser = {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    isSuperAdmin: false,
    isTenantAdmin: true,
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: 1,
    isActive: true,
  };

  const mockUserTenantService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggleActive: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserTenantController],
      providers: [
        {
          provide: UserTenantService,
          useValue: mockUserTenantService,
        },
      ],
    })
      .overrideGuard(TenantUserGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TenantAdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TenantIsolationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserTenantController>(UserTenantController);
    service = module.get(UserTenantService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do usuário logado', async () => {
      const tenantId = 1;
      const user = mockCurrentUser;

      mockUserTenantService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(tenantId, user);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(tenantId, user.id);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('deve usar tenantId extraído do @CurrentTenant decorator', async () => {
      const tenantId = 1;
      const user = mockCurrentUser;

      mockUserTenantService.findOne.mockResolvedValue(mockUser);

      await controller.getProfile(tenantId, user);

      expect(service.findOne).toHaveBeenCalledWith(tenantId, user.id);
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar o perfil do usuário logado', async () => {
      const tenantId = 1;
      const user = mockCurrentUser;
      const updateDto: UpdateTenantUserDto = {
        name: 'Updated Name',
        email: 'newemail@example.com',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      mockUserTenantService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(tenantId, user, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(tenantId, user.id, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('deve permitir atualizar apenas o nome', async () => {
      const tenantId = 1;
      const user = mockCurrentUser;
      const updateDto: UpdateTenantUserDto = {
        name: 'Updated Name Only',
      };

      mockUserTenantService.update.mockResolvedValue(mockUser);

      await controller.updateProfile(tenantId, user, updateDto);

      expect(service.update).toHaveBeenCalledWith(tenantId, user.id, updateDto);
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar a senha do usuário logado', async () => {
      const user = mockCurrentUser;
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
        newPasswordConfirm: 'NewPassword@123',
      };

      mockUserTenantService.updatePassword.mockResolvedValue(mockUser);

      const result = await controller.updatePassword(user, updatePasswordDto);

      expect(result).toEqual(mockUser);
      expect(service.updatePassword).toHaveBeenCalledWith(
        user.id,
        updatePasswordDto,
      );
      expect(service.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro quando senha atual está incorreta', async () => {
      const user = mockCurrentUser;
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword@123',
        newPasswordConfirm: 'NewPassword@123',
      };

      const error = new Error('Senha atual incorreta');
      mockUserTenantService.updatePassword.mockRejectedValue(error);

      await expect(
        controller.updatePassword(user, updatePasswordDto),
      ).rejects.toThrow(error);
    });
  });

  describe('createUser', () => {
    it('deve criar um novo usuário no tenant (Tenant Admin)', async () => {
      const tenantId = 1;
      const createDto: CreateTenantUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Password@123',
        roleIds: [1, 2],
        isActive: true,
      };

      mockUserTenantService.create.mockResolvedValue(mockUser);

      const result = await controller.createUser(tenantId, createDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(tenantId, createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('deve usar tenantId do usuário logado via @CurrentTenant', async () => {
      const tenantId = 1;
      const createDto: CreateTenantUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Password@123',
      };

      mockUserTenantService.create.mockResolvedValue(mockUser);

      await controller.createUser(tenantId, createDto);

      expect(service.create).toHaveBeenCalledWith(tenantId, createDto);
    });

    it('deve criar usuário sem roles quando não fornecidas', async () => {
      const tenantId = 1;
      const createDto: CreateTenantUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Password@123',
      };

      mockUserTenantService.create.mockResolvedValue(mockUser);

      await controller.createUser(tenantId, createDto);

      expect(service.create).toHaveBeenCalledWith(tenantId, createDto);
    });
  });

  describe('findAllUsers', () => {
    it('deve listar todos os usuários do tenant', async () => {
      const tenantId = 1;
      const paginationDto = { page: 1, limit: 10 };
      const expectedResult = {
        items: [mockUser],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockUserTenantService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAllUsers(tenantId, paginationDto);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(tenantId, paginationDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve filtrar apenas usuários do mesmo tenant', async () => {
      const tenantId = 1;
      const paginationDto = { page: 1, limit: 10 };

      mockUserTenantService.findAll.mockResolvedValue({
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      });

      await controller.findAllUsers(tenantId, paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(tenantId, paginationDto);
    });
  });

  describe('findOneUser', () => {
    it('deve retornar um usuário específico do tenant', async () => {
      const tenantId = 1;
      const userId = 2;

      mockUserTenantService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOneUser(tenantId, userId);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(tenantId, userId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro quando usuário não pertence ao tenant', async () => {
      const tenantId = 1;
      const userId = 999;
      const error = new Error(
        'Usuário com ID 999 não encontrado no seu tenant',
      );

      mockUserTenantService.findOne.mockRejectedValue(error);

      await expect(controller.findOneUser(tenantId, userId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('updateUser', () => {
    it('deve atualizar um usuário do tenant (Tenant Admin)', async () => {
      const tenantId = 1;
      const userId = 2;
      const updateDto: UpdateTenantUserDto = {
        name: 'Updated User Name',
        isActive: false,
      };

      const updatedUser = { ...mockUser, ...updateDto };
      mockUserTenantService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(tenantId, userId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(tenantId, userId, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('deve validar que usuário pertence ao tenant antes de atualizar', async () => {
      const tenantId = 1;
      const userId = 2;
      const updateDto: UpdateTenantUserDto = {
        email: 'newemail@example.com',
      };

      mockUserTenantService.update.mockResolvedValue(mockUser);

      await controller.updateUser(tenantId, userId, updateDto);

      expect(service.update).toHaveBeenCalledWith(tenantId, userId, updateDto);
    });
  });

  describe('toggleUserActive', () => {
    it('deve ativar/desativar um usuário (Tenant Admin)', async () => {
      const tenantId = 1;
      const userId = 2;
      const toggledUser = { ...mockUser, isActive: false };

      mockUserTenantService.toggleActive.mockResolvedValue(toggledUser);

      const result = await controller.toggleUserActive(tenantId, userId);

      expect(result).toEqual(toggledUser);
      expect(service.toggleActive).toHaveBeenCalledWith(tenantId, userId);
      expect(service.toggleActive).toHaveBeenCalledTimes(1);
    });

    it('deve alternar status de ativo para inativo', async () => {
      const tenantId = 1;
      const userId = 2;
      const inactiveUser = { ...mockUser, isActive: false };

      mockUserTenantService.toggleActive.mockResolvedValue(inactiveUser);

      const result = await controller.toggleUserActive(tenantId, userId);

      expect(result.isActive).toBe(false);
    });
  });

  describe('Guards', () => {
    it('deve ter guards configurados no controller', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        UserTenantController,
      ) as unknown[];

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('deve ter TenantAdminGuard em createUser', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        UserTenantController.prototype.createUser,
      ) as unknown[];

      expect(guards).toBeDefined();
    });

    it('deve ter TenantAdminGuard em updateUser', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        UserTenantController.prototype.updateUser,
      ) as unknown[];

      expect(guards).toBeDefined();
    });

    it('deve ter TenantAdminGuard em toggleUserActive', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        UserTenantController.prototype.toggleUserActive,
      ) as unknown[];

      expect(guards).toBeDefined();
    });
  });

  describe('Swagger Documentation', () => {
    it('deve ter ApiTags definido', () => {
      const tags = Reflect.getMetadata(
        'swagger/apiUseTags',
        UserTenantController,
      ) as unknown;
      expect(tags).toBeDefined();
    });

    it('deve ter ApiBearerAuth definido', () => {
      const bearerAuth = Reflect.getMetadata(
        'swagger/apiSecurity',
        UserTenantController,
      ) as unknown;
      expect(bearerAuth).toBeDefined();
    });
  });
});
