import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { validationMessages } from 'src/common/messages/validation-messages';

interface UserRequest {
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isActive: boolean;
}

@Injectable()
export class AdminGuard implements CanActivate {
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

    // Permitir acesso para Super Admin ou Tenant Admin
    if (!user.isSuperAdmin && !user.isTenantAdmin) {
      throw new ForbiddenException(
        validationMessages.AUTH.ACCESS_DENIED_ADMIN_ONLY,
      );
    }

    return true;
  }
}
