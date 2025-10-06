import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { validationMessages } from 'src/common/messages/validation-messages';

interface UserRequest {
  id: number;
  email: string;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  tenantId: number | null;
  isActive: boolean;
}

/**
 * Guard que verifica se o usuário pertence a um tenant
 * Bloqueia Super Admins (que não pertencem a tenants)
 * Verifica se o usuário está ativo
 */
@Injectable()
export class TenantUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: { user: UserRequest } = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(validationMessages.AUTH.NOT_AUTHENTICATED);
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new ForbiddenException('Usuário desativado');
    }

    // Super Admins não pertencem a tenants
    // Este módulo é apenas para usuários de tenant
    if (user.isSuperAdmin) {
      throw new ForbiddenException(
        'Super administradores não podem acessar este recurso. Use o módulo de administração global.',
      );
    }

    // Verificar se o usuário pertence a um tenant
    if (!user.tenantId) {
      throw new ForbiddenException('Usuário não pertence a nenhum tenant');
    }

    return true;
  }
}
