import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

export class AssignPermissionsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array de IDs de permissões para atribuir ao usuário',
    type: [Number],
  })
  @IsArray({ message: 'permissionIds deve ser um array' })
  @IsInt({ each: true, message: validationMessages.IS_INT('permissionIds') })
  permissionIds: number[];
}
