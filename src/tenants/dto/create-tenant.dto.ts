import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Empresa ABC Ltda',
    description: 'Nome da empresa/tenant',
  })
  @IsString({ message: validationMessages.IS_STRING('name') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('name') })
  name: string;

  @ApiProperty({
    example: 'empresa-abc',
    description: 'Identificador único do tenant (slug)',
  })
  @IsString({ message: validationMessages.IS_STRING('slug') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('slug') })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @ApiProperty({
    example: '12.345.678/0001-90',
    description: 'CNPJ ou identificação fiscal',
    required: false,
  })
  @IsString({ message: validationMessages.IS_STRING('document') })
  @IsOptional()
  document?: string;

  @ApiProperty({
    example: true,
    description: 'Define se o tenant está ativo',
    default: true,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isActive') })
  @IsOptional()
  isActive?: boolean = true;
}
