import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { validationMessages } from 'src/common/messages/validation-messages';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: validationMessages.EMAIL.INVALID })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('email') })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString({ message: validationMessages.IS_STRING('password') })
  @IsNotEmpty({ message: validationMessages.NOT_EMPTY('password') })
  password: string;
}
