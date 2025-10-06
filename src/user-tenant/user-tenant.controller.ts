import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import {
  UpdatePasswordDto,
  UpdateTenantUserDto,
} from './dto/update-tenant-user.dto';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { TenantIsolationGuard } from './guards/tenant-isolation.guard';
import { TenantUserGuard } from './guards/tenant-user.guard';
import { UserTenantService } from './user-tenant.service';

/**
 * Controller para operações de usuários dentro de um tenant
 * Todos os endpoints requerem que o usuário esteja autenticado e pertença a um tenant
 * O tenantId é extraído automaticamente do usuário logado
 */
@ApiTags('User Tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantUserGuard) // Garante que usuário pertence a um tenant
@Controller('user-tenant')
export class UserTenantController {
  constructor(private readonly userTenantService: UserTenantService) {}

  // ========== PERFIL DO USUÁRIO LOGADO ==========

  @Get('profile')
  @ApiOperation({
    summary: 'Ver meu perfil',
    description: 'Retorna as informações do usuário logado',
  })
  @ApiOkResponse({
    description: 'Perfil do usuário',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Usuário não encontrado',
  })
  getProfile(
    @CurrentTenant() tenantId: number,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.userTenantService.findOne(tenantId, user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Atualiza as informações do usuário logado',
  })
  @ApiOkResponse({
    description: 'Perfil atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados inválidos',
    notFound: 'Usuário não encontrado',
  })
  updateProfile(
    @CurrentTenant() tenantId: number,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateTenantUserDto,
  ): Promise<UserResponseDto> {
    return this.userTenantService.update(tenantId, user.id, updateDto);
  }

  @Patch('profile/password')
  @ApiOperation({
    summary: 'Alterar minha senha',
    description: 'Altera a senha do usuário logado',
  })
  @ApiOkResponse({
    description: 'Senha alterada com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Senha atual incorreta ou senhas não coincidem',
    notFound: 'Usuário não encontrado',
  })
  updatePassword(
    @CurrentUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    return this.userTenantService.updatePassword(user.id, updatePasswordDto);
  }

  // ========== GESTÃO DE USUÁRIOS (TENANT ADMIN) ==========

  @Post('users')
  @UseGuards(TenantAdminGuard) // Apenas Tenant Admin pode criar usuários
  @ApiOperation({
    summary: 'Criar usuário no tenant (Tenant Admin)',
    description:
      'Cria um novo usuário no tenant. O usuário herda automaticamente o tenantId do admin logado.',
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados inválidos ou roles não pertencem ao tenant',
    conflict: 'Email já está em uso',
    forbidden: 'Apenas Tenant Admin pode criar usuários',
  })
  createUser(
    @CurrentTenant() tenantId: number,
    @Body() createDto: CreateTenantUserDto,
  ): Promise<UserResponseDto> {
    // tenantId é extraído automaticamente do usuário logado via @CurrentTenant()
    return this.userTenantService.create(tenantId, createDto);
  }

  @Get('users')
  @ApiOperation({
    summary: 'Listar usuários do tenant (Tenant Admin)',
    description: 'Retorna uma lista paginada de todos os usuários do tenant',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
  })
  @UseGuards(TenantAdminGuard) // Apenas Tenant Admin pode listar usuários
  findAllUsers(
    @CurrentTenant() tenantId: number,
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    // Apenas usuários do mesmo tenant
    return this.userTenantService.findAll(tenantId, paginationDto);
  }

  @Get('users/:id')
  @UseGuards(TenantIsolationGuard, TenantAdminGuard) // Garante que o usuário pertence ao tenant
  @ApiOperation({
    summary: 'Buscar usuário por ID (Tenant Admin)',
    description: 'Retorna um usuário específico do tenant pelo ID',
  })
  @ApiOkResponse({
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Usuário não encontrado no seu tenant',
    forbidden: 'Usuário pertence a outro tenant',
  })
  findOneUser(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.userTenantService.findOne(tenantId, id);
  }

  @Patch('users/:id')
  @UseGuards(TenantAdminGuard, TenantIsolationGuard) // Apenas Tenant Admin
  @ApiOperation({
    summary: 'Atualizar usuário (Tenant Admin)',
    description: 'Atualiza um usuário do tenant',
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados inválidos',
    notFound: 'Usuário não encontrado',
    forbidden: 'Apenas Tenant Admin ou usuário pertence a outro tenant',
  })
  updateUser(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTenantUserDto,
  ): Promise<UserResponseDto> {
    return this.userTenantService.update(tenantId, id, updateDto);
  }

  @Patch('users/:id/toggle-active')
  @UseGuards(TenantAdminGuard, TenantIsolationGuard) // Apenas Tenant Admin
  @ApiOperation({
    summary: 'Ativar/desativar usuário (Tenant Admin)',
    description: 'Alterna o status ativo/inativo de um usuário do tenant',
  })
  @ApiOkResponse({
    description: 'Status do usuário alterado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Usuário não encontrado',
    forbidden: 'Apenas Tenant Admin ou usuário pertence a outro tenant',
  })
  toggleUserActive(
    @CurrentTenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.userTenantService.toggleActive(tenantId, id);
  }
}
