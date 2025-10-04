import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description: 'Paginated list retrieved successfully',
      schema: {
        allOf: [
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  totalItems: {
                    type: 'number',
                    description: 'Total number of items',
                    example: 100,
                  },
                  itemCount: {
                    type: 'number',
                    description: 'Number of items in current page',
                    example: 10,
                  },
                  itemsPerPage: {
                    type: 'number',
                    description: 'Number of items per page',
                    example: 10,
                  },
                  totalPages: {
                    type: 'number',
                    description: 'Total number of pages',
                    example: 10,
                  },
                  currentPage: {
                    type: 'number',
                    description: 'Current page number',
                    example: 1,
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
