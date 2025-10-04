import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ConflictResponseSchema,
  ErrorResponseSchema,
  ForbiddenResponseSchema,
  NotFoundResponseSchema,
  UnauthorizedResponseSchema,
} from '../schemas/error-response.schema';

export const ApiBadRequest = (description?: string) => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: description || 'Bad request or validation error',
      type: ErrorResponseSchema,
    }),
  );
};

export const ApiNotFound = (description?: string) => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: description || 'Resource not found',
      type: NotFoundResponseSchema,
    }),
  );
};

export const ApiConflict = (description?: string) => {
  return applyDecorators(
    ApiConflictResponse({
      description: description || 'Resource already exists',
      type: ConflictResponseSchema,
    }),
  );
};

export const ApiUnauthorized = (description?: string) => {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: description || 'Unauthorized access',
      type: UnauthorizedResponseSchema,
    }),
  );
};

export const ApiForbidden = (description?: string) => {
  return applyDecorators(
    ApiForbiddenResponse({
      description: description || 'Forbidden resource',
      type: ForbiddenResponseSchema,
    }),
  );
};

export interface ApiErrorResponsesOptions {
  badRequest?: boolean | string;
  notFound?: boolean | string;
  conflict?: boolean | string;
  unauthorized?: boolean | string;
  forbidden?: boolean | string;
}

export const ApiErrorResponses = (options: ApiErrorResponsesOptions) => {
  const decorators: MethodDecorator[] = [];

  if (options.badRequest) {
    decorators.push(
      ApiBadRequest(
        typeof options.badRequest === 'string'
          ? options.badRequest
          : undefined,
      ),
    );
  }

  if (options.notFound) {
    decorators.push(
      ApiNotFound(
        typeof options.notFound === 'string' ? options.notFound : undefined,
      ),
    );
  }

  if (options.conflict) {
    decorators.push(
      ApiConflict(
        typeof options.conflict === 'string' ? options.conflict : undefined,
      ),
    );
  }

  if (options.unauthorized) {
    decorators.push(
      ApiUnauthorized(
        typeof options.unauthorized === 'string'
          ? options.unauthorized
          : undefined,
      ),
    );
  }

  if (options.forbidden) {
    decorators.push(
      ApiForbidden(
        typeof options.forbidden === 'string' ? options.forbidden : undefined,
      ),
    );
  }

  return applyDecorators(...decorators);
};
