import { User } from '@prisma/client';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdatePasswordDto } from 'src/users/dto/update-password.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export function createUserDtoFactory(
  overrides?: Partial<CreateUserDto>,
): CreateUserDto {
  return {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    ...overrides,
  };
}

export function updateUserDtoFactory(
  overrides?: Partial<UpdateUserDto>,
): UpdateUserDto {
  return {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    ...overrides,
  };
}

export function updatePasswordDtoFactory(
  overrides?: Partial<UpdatePasswordDto>,
): UpdatePasswordDto {
  return {
    currentPassword: 'Password123!',
    newPassword: 'NewPassword123!',
    newPasswordConfirm: 'NewPassword123!',
    ...overrides,
  };
}

export function createMockUserFactory(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // Hash mockado
    isAdmin: false,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockUserResponseFactory(
  overrides?: Partial<UserResponseDto>,
): UserResponseDto {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    isAdmin: false,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
