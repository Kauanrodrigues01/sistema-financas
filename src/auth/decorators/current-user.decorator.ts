import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: {
    id: number;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    isTenantAdmin: boolean;
    tenantId: number | null;
    isActive: boolean;
  };
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
