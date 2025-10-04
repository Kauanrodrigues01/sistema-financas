import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
}
