import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { validationMessages } from 'src/common/messages/validation-messages';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockExecutionContext = (user?: {
      isAdmin: boolean;
    }): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as ExecutionContext;
    };

    it('should return true when user is admin', () => {
      const context = createMockExecutionContext({ isAdmin: true });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not admin', () => {
      const context = createMockExecutionContext({ isAdmin: false });

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException(
          validationMessages.AUTH.ACCESS_DENIED_ADMIN_ONLY,
        ),
      );
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException(validationMessages.AUTH.NOT_AUTHENTICATED),
      );
    });

    it('should allow access for admin users', () => {
      const context = createMockExecutionContext({ isAdmin: true });

      expect(() => guard.canActivate(context)).not.toThrow();
    });
  });
});
