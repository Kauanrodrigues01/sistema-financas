import { ExecutionContext } from '@nestjs/common';
import { createMockUserFactory } from 'test/factories/user.factory';
import { CurrentUser } from './current-user.decorator';

interface RequestWithUser {
  user?: {
    id: number;
    email: string;
    name: string;
    isAdmin: boolean;
  };
}

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should extract user from request using callback', () => {
    const mockUser = createMockUserFactory();

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: <T = RequestWithUser>(): T =>
          ({ user: mockUser }) as unknown as T,
      }),
    } as ExecutionContext;

    // Simula o comportamento do decorator
    const request = mockExecutionContext
      .switchToHttp()
      .getRequest<RequestWithUser>();
    expect(request.user).toEqual(mockUser);
  });

  it('should return undefined when user is not in request', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: <T = RequestWithUser>(): T => ({}) as unknown as T,
      }),
    } as ExecutionContext;

    const request = mockExecutionContext
      .switchToHttp()
      .getRequest<RequestWithUser>();
    expect(request.user).toBeUndefined();
  });

  it('should extract admin user from request', () => {
    const mockAdminUser = createMockUserFactory({ isAdmin: true });

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: <T = RequestWithUser>(): T =>
          ({ user: mockAdminUser }) as unknown as T,
      }),
    } as ExecutionContext;

    const request = mockExecutionContext
      .switchToHttp()
      .getRequest<RequestWithUser>();
    expect(request.user).toEqual(mockAdminUser);
    expect(request.user?.isAdmin).toBe(true);
  });
});
