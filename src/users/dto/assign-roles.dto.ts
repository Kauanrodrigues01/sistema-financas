import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

export class AssignRolesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array de IDs de roles para atribuir ao usuário',
    type: [Number],
  })
  @IsArray({ message: 'roleIds deve ser um array' })
  @IsInt({ each: true, message: validationMessages.IS_INT('roleIds') })
  roleIds: number[];
}
