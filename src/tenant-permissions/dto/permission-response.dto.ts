import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PermissionResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'add_user',
    description: 'Código único da permissão',
  })
  @Expose()
  codename: string;

  @ApiProperty({
    example: 'Adicionar Usuário',
    description: 'Nome descritivo da permissão',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'users',
    description: 'Módulo ao qual a permissão pertence',
  })
  @Expose()
  module: string;

  @ApiProperty({
    example: 'Permite criar novos usuários',
    description: 'Descrição detalhada da permissão',
    nullable: true,
  })
  @Expose()
  description: string | null;

  @ApiProperty({ example: '2025-10-05T12:00:00.000Z' })
  @Expose()
  createdAt: Date;
}
