/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { validationMessages } from 'src/common/messages/validation-messages';
import { BcryptService } from 'src/services/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    isSuperAdmin: true,
    isTenantAdmin: true,
    isActive: true,
    tenantId: true,
    tenant: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    userRoles: {
      select: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    },
    userPermissions: {
      select: {
        permission: {
          select: {
            id: true,
            codename: true,
            name: true,
            module: true,
            description: true,
          },
        },
      },
    },
    createdAt: true,
    updatedAt: true,
  };

  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
  ) {}

  private transformUserResponse(user: any): UserResponseDto {
    return {
      ...user,
      // eslint-disable-next-line
      roles: user.userRoles?.map((ur: any) => ur.role) || [],
      // eslint-disable-next-line
      permissions: user.userPermissions?.map((up: any) => up.permission) || [],
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.checkEmailExists(createUserDto.email);

    const hashedPassword = await this.bcryptService.hashPassword(
      createUserDto.password,
    );

    if (createUserDto.tenantId === 0) {
      createUserDto.tenantId = null;
    }

    // Validação: Super Admin não pode ter tenantId
    if (createUserDto.isSuperAdmin && createUserDto.tenantId) {
      throw new BadRequestException(
        'Um super administrador não pode pertencer a um tenant.',
      );
    }

    // Validação: Tenant Admin deve ter tenantId
    if (createUserDto.isTenantAdmin && !createUserDto.tenantId) {
      throw new BadRequestException(
        'Um usuário administrador do tenant deve pertencer a um tenant.',
      );
    }

    // Validação: Não permitir criar Super Admin via API
    if (createUserDto.isSuperAdmin) {
      throw new BadRequestException(
        'Não é permitido criar super administradores via API. Use o sistema de seed/migration.',
      );
    }

    // Validação: Tenant existe
    if (createUserDto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: createUserDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant com ID ${createUserDto.tenantId} não encontrado.`,
        );
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        tenantId: createUserDto.tenantId,
        isSuperAdmin: createUserDto.isSuperAdmin || false,
        isTenantAdmin: createUserDto.isTenantAdmin || false,
        isActive: createUserDto.isActive ?? true,
      },
      select: this.userSelect,
    });

    return this.transformUserResponse(user);
  }

  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users.map((user) => this.transformUserResponse(user)),
      meta: {
        totalItems,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(validationMessages.USER.NOT_FOUND(id));
    }

    return this.transformUserResponse(user);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const currentUser = await this.findOne(id);

    if (updateUserDto.email) {
      await this.checkEmailExists(updateUserDto.email, id);
    }

    // Validação: Não permitir alterar isSuperAdmin de usuário comum
    if (
      updateUserDto.isSuperAdmin !== undefined &&
      updateUserDto.isSuperAdmin !== currentUser.isSuperAdmin
    ) {
      throw new BadRequestException(
        'Não é permitido alterar o status de super administrador.',
      );
    }

    // Validação: Super Admin não pode ter tenantId
    if (updateUserDto.isSuperAdmin && updateUserDto.tenantId) {
      throw new BadRequestException(
        'Um super administrador não pode pertencer a um tenant.',
      );
    }

    // Validação: Tenant Admin deve ter tenantId
    if (
      updateUserDto.isTenantAdmin &&
      !updateUserDto.tenantId &&
      !currentUser.tenantId
    ) {
      throw new BadRequestException(
        'Um usuário administrador do tenant deve pertencer a um tenant.',
      );
    }

    // Validação: Mudança de tenant (verificar implicações)
    if (
      updateUserDto.tenantId !== undefined &&
      updateUserDto.tenantId !== currentUser.tenantId
    ) {
      // Remover roles e permissões ao mudar de tenant
      await this.prisma.$transaction([
        this.prisma.userRole.deleteMany({
          where: { userId: id },
        }),
        this.prisma.userPermission.deleteMany({
          where: { userId: id },
        }),
      ]);
    }

    // Validação: Tenant existe
    if (updateUserDto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: updateUserDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant com ID ${updateUserDto.tenantId} não encontrado.`,
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: this.userSelect,
    });

    return this.transformUserResponse(user);
  }

  async remove(id: number): Promise<UserResponseDto> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });

    return this.transformUserResponse(user);
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    // Buscar usuário com password para validação
    const currentUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      throw new NotFoundException(validationMessages.USER.NOT_FOUND(id));
    }

    // Validar se as novas senhas coincidem
    if (
      updatePasswordDto.newPassword !== updatePasswordDto.newPasswordConfirm
    ) {
      throw new BadRequestException('As senhas não coincidem');
    }

    // Validar senha atual
    const isPasswordValid = await this.bcryptService.comparePasswords(
      updatePasswordDto.currentPassword,
      currentUser.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await this.bcryptService.hashPassword(
      updatePasswordDto.newPassword,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: this.userSelect,
    });

    return this.transformUserResponse(updatedUser);
  }

  async assignRoles(
    userId: number,
    roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.findOne(userId);

    // Super Admin não pode ter roles
    if (user.isSuperAdmin) {
      throw new BadRequestException(
        'Super administradores possuem controle total e não precisam de roles.',
      );
    }

    // Validar que roles existem e pertencem ao mesmo tenant do usuário
    if (user.tenantId) {
      const roles = await this.prisma.role.findMany({
        where: {
          id: { in: roleIds },
          tenantId: user.tenantId,
        },
      });

      if (roles.length !== roleIds.length) {
        throw new BadRequestException(
          'Uma ou mais roles não foram encontradas ou não pertencem ao tenant do usuário.',
        );
      }
    }

    // Criar relacionamentos UserRole
    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(userId);
  }

  async removeRoles(
    userId: number,
    roleIds: number[],
  ): Promise<UserResponseDto> {
    await this.findOne(userId);

    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: { in: roleIds },
      },
    });

    return this.findOne(userId);
  }

  async assignPermissions(
    userId: number,
    permissionIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.findOne(userId);

    // Super Admin não pode ter permissões diretas
    if (user.isSuperAdmin) {
      throw new BadRequestException(
        'Super administradores possuem controle total e não precisam de permissões.',
      );
    }

    // Validar que permissões existem
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException(
        'Uma ou mais permissões não foram encontradas.',
      );
    }

    // Criar relacionamentos UserPermission
    await this.prisma.userPermission.createMany({
      data: permissionIds.map((permissionId) => ({
        userId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(userId);
  }

  async removePermissions(
    userId: number,
    permissionIds: number[],
  ): Promise<UserResponseDto> {
    await this.findOne(userId);

    await this.prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: { in: permissionIds },
      },
    });

    return this.findOne(userId);
  }

  async getUserPermissions(userId: number) {
    const user = await this.findOne(userId);

    // Super Admin tem todas as permissões
    if (user.isSuperAdmin) {
      return {
        isSuperAdmin: true,
        message: 'Super administrador possui acesso total ao sistema',
        permissions: [],
      };
    }

    // Obter permissões das roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const rolePermissions = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission),
    );

    // Obter permissões diretas
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    const directPermissions = userPermissions.map((up) => up.permission);

    // Combinar e remover duplicatas
    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map((p) => [p.id, p])).values(),
    );

    return {
      isSuperAdmin: false,
      totalPermissions: uniquePermissions.length,
      fromRoles: rolePermissions.length,
      direct: directPermissions.length,
      permissions: uniquePermissions,
    };
  }

  async findByTenant(
    tenantId: number,
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return {
      items: users.map((user) => this.transformUserResponse(user)),
      meta: {
        totalItems,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async toggleActive(userId: number): Promise<UserResponseDto> {
    const user = await this.findOne(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: this.userSelect,
    });

    return this.transformUserResponse(updatedUser);
  }

  private async checkEmailExists(
    email: string,
    excludeId?: number,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== excludeId) {
      throw new ConflictException(validationMessages.EMAIL.ALREADY_IN_USE);
    }
  }
}
