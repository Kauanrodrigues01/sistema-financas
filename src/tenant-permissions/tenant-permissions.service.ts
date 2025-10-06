import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PermissionsByModuleResponseDto } from './dto/permissions-by-module-response.dto';

/**
 * Service READ-ONLY para consulta de permissões disponíveis
 * Permissões são criadas apenas via seed/migration
 */
@Injectable()
export class TenantPermissionsService {
  private readonly permissionSelect = {
    id: true,
    codename: true,
    name: true,
    module: true,
    description: true,
    createdAt: true,
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Listar todas as permissões disponíveis (paginado)
   */
  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PermissionResponseDto>> {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const [permissions, totalItems] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        skip,
        take: limit,
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
        select: this.permissionSelect,
      }),
      this.prisma.permission.count(),
    ]);

    return {
      items: permissions,
      meta: {
        totalItems,
        itemCount: permissions.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Buscar permissão por ID
   */
  async findOne(id: number): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: this.permissionSelect,
    });

    if (!permission) {
      throw new NotFoundException(`Permissão com ID ${id} não encontrada`);
    }

    return permission;
  }

  /**
   * Listar permissões agrupadas por módulo
   */
  async findByModule(): Promise<PermissionsByModuleResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
      select: this.permissionSelect,
    });

    // Agrupar por módulo
    const grouped = permissions.reduce(
      (acc, permission) => {
        const module = permission.module;
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      },
      {} as Record<string, PermissionResponseDto[]>,
    );

    // Transformar em array de objetos
    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      count: perms.length,
      permissions: perms,
    }));
  }

  /**
   * Listar permissões de um módulo específico
   */
  async findByModuleName(
    moduleName: string,
  ): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { module: moduleName },
      orderBy: { name: 'asc' },
      select: this.permissionSelect,
    });

    if (permissions.length === 0) {
      throw new NotFoundException(
        `Nenhuma permissão encontrada para o módulo "${moduleName}"`,
      );
    }

    return permissions;
  }

  /**
   * Listar todos os módulos disponíveis
   */
  async findModules(): Promise<string[]> {
    const modules = await this.prisma.permission.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });

    return modules.map((m) => m.module);
  }
}
