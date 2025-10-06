import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail({}, { message: validationMessages.EMAIL.INVALID })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('email') })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: validationMessages.IS_STRING('name') })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário (mínimo 6 caracteres)',
  })
  @IsString({ message: validationMessages.IS_STRING('password') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('password') })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 1,
    description: 'ID do tenant ao qual o usuário pertence',
    required: false,
  })
  @IsInt({ message: validationMessages.IS_INT('tenantId') })
  @IsOptional()
  tenantId?: number | null;

  @ApiProperty({
    example: false,
    description:
      'Define se o usuário é um super administrador (acesso total ao sistema)',
    default: false,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isSuperAdmin') })
  @IsOptional()
  isSuperAdmin?: boolean = false;

  @ApiProperty({
    example: false,
    description: 'Define se o usuário é um administrador do tenant',
    default: false,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isTenantAdmin') })
  @IsOptional()
  isTenantAdmin?: boolean = false;

  @ApiProperty({
    example: true,
    description: 'Define se o usuário está ativo',
    default: true,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isActive') })
  @IsOptional()
  isActive?: boolean = true;
}
