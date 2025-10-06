import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface UserRequest {
  id: number;
  tenantId: number | null;
  isSuperAdmin: boolean;
}

/**
 * Guard que garante isolamento de dados por tenant
 * Verifica se o recurso solicitado pertence ao tenant do usuário logado
 * Previne acesso cruzado entre tenants
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserRequest = request.user;
    const resourceId = request.params.id;

    // Se não há ID no parâmetro, não há necessidade de validação
    if (!resourceId) {
      return true;
    }

    // Validar que o recurso pertence ao tenant do usuário
    // Detecta automaticamente o tipo de recurso pela rota
    const resourceType = this.getResourceType(request.route.path);

    if (!resourceType) {
      return true; // Se não conseguir detectar o tipo, permite (outras validações vão cuidar)
    }

    const resource = await this.getResource(resourceType, parseInt(resourceId));

    if (!resource) {
      throw new NotFoundException(
        `${resourceType} com ID ${resourceId} não encontrado`,
      );
    }

    // Verificar se o recurso pertence ao tenant do usuário
    if (resource.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'Acesso negado. Este recurso pertence a outro tenant.',
      );
    }

    return true;
  }

  private getResourceType(path: string): string | null {
    if (path.includes('/users/')) return 'user';
    if (path.includes('/roles/')) return 'role';
    return null;
  }

  private async getResource(
    type: string,
    id: number,
  ): Promise<{ tenantId: number | null } | null> {
    switch (type) {
      case 'user':
        return this.prisma.user.findUnique({
          where: { id },
          select: { tenantId: true },
        });
      case 'role':
        return this.prisma.role.findUnique({
          where: { id },
          select: { tenantId: true },
        });
      default:
        return null;
    }
  }
}
