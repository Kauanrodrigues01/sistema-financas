import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { validationMessages } from 'src/common/messages/validation-messages';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: { user: { isAdmin: boolean } } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(validationMessages.AUTH.NOT_AUTHENTICATED);
    }

    if (!user.isAdmin) {
      throw new ForbiddenException(
        validationMessages.AUTH.ACCESS_DENIED_ADMIN_ONLY,
      );
    }

    return true;
  }
}
