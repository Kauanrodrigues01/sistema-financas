import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
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
  name?: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário (mínimo 6 caracteres)',
  })
  @IsString({ message: validationMessages.IS_STRING('password') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('password') })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}
