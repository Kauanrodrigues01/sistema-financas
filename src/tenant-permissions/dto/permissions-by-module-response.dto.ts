import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto';

export class PermissionsByModuleResponseDto {
  @ApiProperty({
    example: 'users',
    description: 'Nome do módulo',
  })
  module: string;

  @ApiProperty({
    example: 4,
    description: 'Quantidade de permissões no módulo',
  })
  count: number;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: 'Lista de permissões do módulo',
  })
  permissions: PermissionResponseDto[];
}
