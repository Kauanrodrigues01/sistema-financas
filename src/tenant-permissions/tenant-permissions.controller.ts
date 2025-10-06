import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';
import { TenantAdminGuard } from 'src/user-tenant/guards/tenant-admin.guard';
import { TenantUserGuard } from 'src/user-tenant/guards/tenant-user.guard';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PermissionsByModuleResponseDto } from './dto/permissions-by-module-response.dto';
import { TenantPermissionsService } from './tenant-permissions.service';

/**
 * Controller READ-ONLY para visualização de permissões disponíveis
 * ACESSO RESTRITO: Apenas Tenant Admin pode consultar permissões
 * Útil para que Tenant Admin saiba quais permissões existem ao criar/editar roles
 */
@ApiTags('Tenant Permissions (Tenant Admin Only)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantUserGuard, TenantAdminGuard) // APENAS TENANT ADMIN
@Controller('tenant-permissions')
export class TenantPermissionsController {
  constructor(
    private readonly tenantPermissionsService: TenantPermissionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas as permissões (Tenant Admin)',
    description:
      'Retorna uma lista paginada de todas as permissões disponíveis no sistema. Apenas Tenant Admin.',
  })
  @ApiPaginatedResponse(PermissionResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
    forbidden: 'Apenas Tenant Admin pode acessar',
  })
  findAll(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PermissionResponseDto>> {
    return this.tenantPermissionsService.findAll(paginationDto);
  }

  @Get('by-module')
  @ApiOperation({
    summary: 'Listar permissões agrupadas por módulo (Tenant Admin)',
    description:
      'Retorna todas as permissões agrupadas por módulo (users, finance, etc). Apenas Tenant Admin.',
  })
  @ApiOkResponse({
    description: 'Permissões agrupadas por módulo',
    type: [PermissionsByModuleResponseDto],
  })
  @ApiErrorResponses({
    forbidden: 'Apenas Tenant Admin pode acessar',
  })
  findByModule(): Promise<PermissionsByModuleResponseDto[]> {
    return this.tenantPermissionsService.findByModule();
  }

  @Get('modules')
  @ApiOperation({
    summary: 'Listar todos os módulos (Tenant Admin)',
    description:
      'Retorna lista de todos os módulos que possuem permissões. Apenas Tenant Admin.',
  })
  @ApiOkResponse({
    description: 'Lista de módulos',
    type: [String],
    example: ['users', 'finance', 'reports'],
  })
  @ApiErrorResponses({
    forbidden: 'Apenas Tenant Admin pode acessar',
  })
  findModules(): Promise<string[]> {
    return this.tenantPermissionsService.findModules();
  }

  @Get('module/:moduleName')
  @ApiOperation({
    summary: 'Listar permissões de um módulo específico (Tenant Admin)',
    description:
      'Retorna todas as permissões de um módulo (ex: users, finance). Apenas Tenant Admin.',
  })
  @ApiOkResponse({
    description: 'Permissões do módulo',
    type: [PermissionResponseDto],
  })
  @ApiErrorResponses({
    notFound: 'Módulo não encontrado ou sem permissões',
    forbidden: 'Apenas Tenant Admin pode acessar',
  })
  findByModuleName(
    @Param('moduleName') moduleName: string,
  ): Promise<PermissionResponseDto[]> {
    return this.tenantPermissionsService.findByModuleName(moduleName);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar permissão por ID (Tenant Admin)',
    description:
      'Retorna os detalhes de uma permissão específica. Apenas Tenant Admin.',
  })
  @ApiOkResponse({
    description: 'Detalhes da permissão',
    type: PermissionResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Permissão não encontrada',
    forbidden: 'Apenas Tenant Admin pode acessar',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PermissionResponseDto> {
    return this.tenantPermissionsService.findOne(id);
  }
}
