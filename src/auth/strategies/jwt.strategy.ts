import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { validationMessages } from 'src/common/messages/validation-messages';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        isTenantAdmin: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(validationMessages.AUTH.USER_NOT_FOUND);
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    return user;
  }
}
