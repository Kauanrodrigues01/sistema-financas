import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class TenantDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Empresa ABC Ltda' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'empresa-abc' })
  @Expose()
  slug: string;
}

class RoleDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Gerente Financeiro' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Gerencia todas as operações financeiras' })
  @Expose()
  description: string | null;
}

class PermissionDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'add_user' })
  @Expose()
  codename: string;

  @ApiProperty({ example: 'Adicionar Usuário' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'users' })
  @Expose()
  module: string;

  @ApiProperty({ example: 'Permite adicionar novos usuários ao sistema' })
  @Expose()
  description: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'João Silva', nullable: true })
  @Expose()
  name: string | null;

  @ApiProperty({
    example: false,
    description: 'Indica se o usuário é um super administrador',
  })
  @Expose()
  isSuperAdmin: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID do tenant ao qual o usuário pertence',
    nullable: true,
  })
  @Expose()
  tenantId: number | null;

  @ApiProperty({
    example: false,
    description: 'Indica se o usuário é administrador do tenant',
  })
  @Expose()
  isTenantAdmin: boolean;

  @ApiProperty({
    example: true,
    description: 'Indica se o usuário está ativo',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    type: TenantDto,
    nullable: true,
    description: 'Informações do tenant ao qual o usuário pertence',
  })
  @Expose()
  @Type(() => TenantDto)
  tenant?: TenantDto | null;

  @ApiProperty({
    type: [RoleDto],
    description: 'Roles atribuídos ao usuário',
    isArray: true,
  })
  @Expose()
  @Type(() => RoleDto)
  roles?: RoleDto[];

  @ApiProperty({
    type: [PermissionDto],
    description: 'Permissões diretas atribuídas ao usuário',
    isArray: true,
  })
  @Expose()
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];

  @ApiProperty({ example: '2025-10-04T12:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-10-04T12:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
