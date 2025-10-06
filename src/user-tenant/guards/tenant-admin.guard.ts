import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface UserRequest {
  id: number;
  isTenantAdmin: boolean;
  tenantId: number | null;
  isActive: boolean;
}

/**
 * Guard que verifica se o usuário é Tenant Admin
 * Usado para operações administrativas dentro do tenant
 */
@Injectable()
export class TenantAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: { user: UserRequest } = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new ForbiddenException('Usuário desativado');
    }

    // Verificar se o usuário pertence a um tenant
    if (!user.tenantId) {
      throw new ForbiddenException('Usuário não pertence a nenhum tenant');
    }

    // Verificar se é Tenant Admin
    if (!user.isTenantAdmin) {
      throw new ForbiddenException(
        'Acesso negado. Apenas administradores do tenant podem acessar este recurso.',
      );
    }

    return true;
  }
}
