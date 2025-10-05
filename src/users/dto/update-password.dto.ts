import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

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
    description: 'Nova senha do usuário (mínimo 6 caracteres)',
  })
  @IsString({ message: validationMessages.IS_STRING('newPassword') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('newPassword') })
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Confirmação da nova senha',
  })
  @IsString({ message: validationMessages.IS_STRING('newPasswordConfirm') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('newPasswordConfirm') })
  newPasswordConfirm: string;
}
