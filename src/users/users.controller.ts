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
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users (SuperAdmin Only)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar um novo usuário',
    description:
      'Cria um novo usuário com as informações fornecidas. Apenas administradores.',
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do usuário inválidos ou erro de validação',
    conflict: 'Email já está em uso',
    forbidden: 'Acesso negado. Apenas administradores.',
  })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description:
      'Retorna uma lista paginada de todos os usuários. Apenas administradores.',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros de paginação inválidos',
    forbidden: 'Acesso negado. Apenas administradores.',
  })
  findAll(
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna um único usuário através do seu ID',
  })
  @ApiOkResponse({
    description: 'Usuário encontrado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'ID do usuário inválido',
    notFound: 'Usuário não encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar um usuário',
    description: 'Atualiza um usuário existente com as informações fornecidas',
  })
  @ApiOkResponse({
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados do usuário inválidos ou erro de validação',
    notFound: 'Usuário não encontrado',
    conflict: 'Email já está em uso',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @ApiOperation({
    summary: 'Atualizar senha do usuário',
    description:
      'Atualiza a senha de um usuário validando a senha atual e confirmação da nova senha',
  })
  @ApiOkResponse({
    description: 'Senha atualizada com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Senha atual incorreta ou senhas não coincidem',
    notFound: 'Usuário não encontrado',
  })
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar um usuário',
    description: 'Deleta um usuário através do seu ID',
  })
  @ApiOkResponse({
    description: 'Usuário deletado com sucesso',
  })
  @ApiErrorResponses({
    badRequest: 'ID do usuário inválido',
    notFound: 'Usuário não encontrado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }

  @Post(':id/roles')
  @ApiOperation({
    summary: 'Atribuir roles ao usuário',
    description:
      'Atribui uma ou mais roles ao usuário. As roles devem pertencer ao mesmo tenant do usuário.',
  })
  @ApiOkResponse({
    description: 'Roles atribuídos com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Roles inválidas ou não pertencem ao tenant do usuário',
    notFound: 'Usuário não encontrado',
  })
  assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRolesDto: AssignRolesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.assignRoles(id, assignRolesDto.roleIds);
  }

  @Delete(':id/roles')
  @ApiOperation({
    summary: 'Remover roles do usuário',
    description: 'Remove uma ou mais roles do usuário',
  })
  @ApiOkResponse({
    description: 'Roles removidos com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados inválidos',
    notFound: 'Usuário não encontrado',
  })
  removeRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRolesDto: AssignRolesDto,
  ): Promise<UserResponseDto> {
    return this.usersService.removeRoles(id, assignRolesDto.roleIds);
  }

  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Atribuir permissões diretas ao usuário',
    description:
      'Atribui permissões diretas ao usuário. Estas permissões sobrescrevem as permissões das roles.',
  })
  @ApiOkResponse({
    description: 'Permissões atribuídas com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Permissões inválidas',
    notFound: 'Usuário não encontrado',
  })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<UserResponseDto> {
    return this.usersService.assignPermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
  }

  @Delete(':id/permissions')
  @ApiOperation({
    summary: 'Remover permissões diretas do usuário',
    description: 'Remove permissões diretas do usuário',
  })
  @ApiOkResponse({
    description: 'Permissões removidas com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    badRequest: 'Dados inválidos',
    notFound: 'Usuário não encontrado',
  })
  removePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<UserResponseDto> {
    return this.usersService.removePermissions(
      id,
      assignPermissionsDto.permissionIds,
    );
  }

  @Get(':id/permissions')
  @ApiOperation({
    summary: 'Listar todas as permissões do usuário',
    description:
      'Retorna todas as permissões do usuário (combinando roles e permissões diretas)',
  })
  @ApiOkResponse({
    description: 'Permissões do usuário recuperadas com sucesso',
  })
  @ApiErrorResponses({
    notFound: 'Usuário não encontrado',
  })
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserPermissions(id);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({
    summary: 'Listar usuários por tenant',
    description: 'Retorna uma lista paginada de usuários de um tenant específico',
  })
  @ApiPaginatedResponse(UserResponseDto)
  @ApiErrorResponses({
    badRequest: 'Parâmetros inválidos',
  })
  findByTenant(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query() paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findByTenant(tenantId, paginationDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Ativar/desativar usuário',
    description: 'Alterna o status de ativo/inativo do usuário',
  })
  @ApiOkResponse({
    description: 'Status do usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiErrorResponses({
    notFound: 'Usuário não encontrado',
  })
  toggleActive(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.toggleActive(id);
  }
}
