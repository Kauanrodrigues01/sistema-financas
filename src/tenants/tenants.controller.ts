import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiErrorResponses } from 'src/common/swagger/decorators/api-error-responses.decorator';
import { ApiPaginatedResponse } from 'src/common/swagger/decorators/api-paginated-response.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar um novo tenant',
    description:
      'Cria um novo tenant (empresa/cliente). Apenas super administradores.',
  })
  @ApiCreatedResponse({
    description: 'Tenant criado com sucesso',
    type: TenantResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do tenant inválidos ou erro de validação',
    conflict: 'Slug ou documento já está em uso',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os tenants',
    description:
      'Retorna uma lista paginada de todos os tenants. Apenas super administradores.',
  })
  @ApiPaginatedResponse(TenantResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  findAll(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    return this.tenantsService.findAll(paginationDto);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Listar tenants ativos',
    description:
      'Retorna uma lista paginada de tenants ativos. Apenas super administradores.',
  })
  @ApiPaginatedResponse(TenantResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  findActive(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    return this.tenantsService.findActive(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar tenant por ID',
    description: 'Retorna um único tenant através do seu ID',
  })
  @ApiOkResponse({
    description: 'Tenant encontrado com sucesso',
    type: TenantResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'ID do tenant inválido',
    notFound: 'Tenant não encontrado',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar um tenant',
    description: 'Atualiza um tenant existente com as informações fornecidas',
  })
  @ApiOkResponse({
    description: 'Tenant atualizado com sucesso',
    type: TenantResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do tenant inválidos ou erro de validação',
    notFound: 'Tenant não encontrado',
    conflict: 'Slug ou documento já está em uso',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Ativar/desativar tenant',
    description: 'Alterna o status de ativo/inativo do tenant',
  })
  @ApiOkResponse({
    description: 'Status do tenant atualizado com sucesso',
    type: TenantResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Tenant não encontrado',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar um tenant',
    description:
      'Deleta um tenant através do seu ID. ATENÇÃO: Remove todos os usuários, roles e dados associados ao tenant.',
  })
  @ApiOkResponse({
    description: 'Tenant deletado com sucesso',
  })
  @ApiErrorResponses({
    badRequest: 'ID do tenant inválido',
    notFound: 'Tenant não encontrado',
    forbidden: 'Acesso negado. Apenas super administradores.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.tenantsService.remove(id);
  }
}
