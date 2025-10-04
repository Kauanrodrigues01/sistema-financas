import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ example: 1, required: false, description: 'Page number' })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({
    example: 10,
    required: false,
    description: 'Number of items per page',
  })
  @Max(50, { message: 'Número máximo de itens por página é 50' })
  limit?: number = 10;
}
