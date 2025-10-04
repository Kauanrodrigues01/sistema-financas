import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMetaDto {
  @ApiProperty({
    description: 'Total number of items in the database',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Number of items in the current page',
    example: 10,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginatedMetaDto,
  })
  meta: PaginatedMetaDto;

  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  items: T[];
}
