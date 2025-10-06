import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

/**
 * DTO para atualização de usuário do tenant
 * Não permite alterar: tenantId, isSuperAdmin, isTenantAdmin
 */
export class UpdateTenantUserDto {
  @ApiProperty({
    example: 'novo@email.com',
    description: 'Novo email do usuário',
    required: false,
  })
  @IsEmail({}, { message: validationMessages.EMAIL.INVALID })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'João Silva Santos',
    description: 'Novo nome do usuário',
    required: false,
  })
  @IsString({ message: validationMessages.IS_STRING('name') })
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: true,
    description: 'Define se o usuário está ativo',
    required: false,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isActive') })
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO para atualização de senha do usuário
 */
export class UpdatePasswordDto {
  @ApiProperty({
    example: 'SenhaAtual@123',
    description: 'Senha atual do usuário',
  })
  @IsString({ message: validationMessages.IS_STRING('currentPassword') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('currentPassword') })
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha (mínimo 6 caracteres)',
  })
  @IsString({ message: validationMessages.IS_STRING('newPassword') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('newPassword') })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Confirmação da nova senha',
  })
  @IsString({ message: validationMessages.IS_STRING('newPasswordConfirm') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('newPasswordConfirm') })
  newPasswordConfirm: string;
}
