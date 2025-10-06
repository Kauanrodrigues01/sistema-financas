import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: {
    id: number;
    tenantId: number | null;
  };
}

/**
 * Decorator que extrai o tenantId do usuário logado
 * Facilita o uso em controllers para garantir isolamento de dados
 *
 * @example
 * async findUsers(@CurrentTenant() tenantId: number) {
 *   return this.service.findByTenant(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new Error('Usuário não pertence a nenhum tenant');
    }

    return tenantId;
  },
);
