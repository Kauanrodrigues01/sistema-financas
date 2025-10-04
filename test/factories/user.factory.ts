import { User } from '@prisma/client';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

export function createUserDtoFactory(
  overrides?: Partial<CreateUserDto>,
): CreateUserDto {
  return {
    name: 'John Doe',
    email: 'john.doe@example.com',
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

export function createMockUserFactory(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
