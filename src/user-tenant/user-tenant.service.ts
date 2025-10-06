import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { validationMessages } from 'src/common/messages/validation-messages';
import { PrismaService } from 'src/prisma/prisma.service';
import { BcryptService } from 'src/services/bcrypt.service';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import {
  UpdatePasswordDto,
  UpdateTenantUserDto,
} from './dto/update-tenant-user.dto';

@Injectable()
export class UserTenantService {
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
    // eslint-disable-next-line
    return {
      ...user,
      // eslint-disable-next-line
      roles: user.userRoles?.map((ur: any) => ur.role) || [],
      // eslint-disable-next-line
      permissions: user.userPermissions?.map((up: any) => up.permission) || [],
    };
  }

  /**
   * Criar usuário no tenant
   * O tenantId é extraído do usuário logado (via @CurrentTenant() no controller)
   */
  async create(
    tenantId: number,
    createDto: CreateTenantUserDto,
  ): Promise<UserResponseDto> {
    await this.checkEmailExists(createDto.email);

    const hashedPassword = await this.bcryptService.hashPassword(
      createDto.password,
    );

    // Validar roles se fornecidas (devem pertencer ao mesmo tenant)
    if (createDto.roleIds && createDto.roleIds.length > 0) {
      await this.validateRolesBelongToTenant(createDto.roleIds, tenantId);
    }

    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        name: createDto.name,
        password: hashedPassword,
        tenantId, // Tenant ID do usuário logado
        isActive: createDto.isActive ?? true,
        isSuperAdmin: false,
        isTenantAdmin: false,
        ...(createDto.roleIds && createDto.roleIds.length > 0
          ? {
              userRoles: {
                create: createDto.roleIds.map((roleId) => ({ roleId })),
              },
            }
          : {}),
      },
      select: this.userSelect,
    });

    return this.transformUserResponse(user);
  }

  // Listar usuários do tenant
  async findAll(
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

  // Buscar um usuário do tenant
  async findOne(tenantId: number, userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${userId} não encontrado no seu tenant`,
      );
    }

    return this.transformUserResponse(user);
  }

  // Atualizar usuário do tenant
  async update(
    tenantId: number,
    userId: number,
    updateDto: UpdateTenantUserDto,
  ): Promise<UserResponseDto> {
    await this.findOne(tenantId, userId);

    if (updateDto.email) {
      await this.checkEmailExists(updateDto.email, userId);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: this.userSelect,
    });

    return this.transformUserResponse(user);
  }

  // Ativar/desativar usuário
  async toggleActive(
    tenantId: number,
    userId: number,
  ): Promise<UserResponseDto> {
    const user = await this.findOne(tenantId, userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: this.userSelect,
    });

    return this.transformUserResponse(updated);
  }

  // Atualizar senha (usuário próprio)
  async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(validationMessages.USER.NOT_FOUND(userId));
    }

    if (
      updatePasswordDto.newPassword !== updatePasswordDto.newPasswordConfirm
    ) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const isPasswordValid = await this.bcryptService.comparePasswords(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const hashedPassword = await this.bcryptService.hashPassword(
      updatePasswordDto.newPassword,
    );

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: this.userSelect,
    });

    return this.transformUserResponse(updated);
  }

  // Helpers privados
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

  private async validateRolesBelongToTenant(
    roleIds: number[],
    tenantId: number,
  ): Promise<void> {
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
        tenantId,
      },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException(
        'Uma ou mais roles não pertencem ao seu tenant',
      );
    }
  }
}
