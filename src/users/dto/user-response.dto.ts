import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'João Silva', nullable: true })
  @Expose()
  name: string | null;

  @ApiProperty({ example: '2025-10-04T12:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-10-04T12:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
