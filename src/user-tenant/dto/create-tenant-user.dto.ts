import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

/**
 * DTO para criação de usuário dentro de um tenant
 * Usuários criados por Tenant Admin herdam automaticamente o tenantId do admin
 * Não permite criar Super Admin ou Tenant Admin por segurança
 */
export class CreateTenantUserDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: validationMessages.EMAIL.INVALID })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('email') })
  email: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
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
    example: [1, 2],
    description: 'IDs das roles a serem atribuídas ao usuário',
    required: false,
    type: [Number],
  })
  @IsArray({ message: 'roleIds deve ser um array' })
  @IsInt({ each: true, message: validationMessages.IS_INT('roleIds') })
  @IsOptional()
  roleIds?: number[];

  @ApiProperty({
    example: true,
    description: 'Define se o usuário está ativo',
    default: true,
  })
  @IsBoolean({ message: validationMessages.IS_BOOLEAN('isActive') })
  @IsOptional()
  isActive?: boolean = true;
}
