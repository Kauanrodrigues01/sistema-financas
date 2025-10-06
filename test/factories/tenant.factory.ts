import { Tenant } from '@prisma/client';
import { CreateTenantDto } from 'src/tenants/dto/create-tenant.dto';
import { TenantResponseDto } from 'src/tenants/dto/tenant-response.dto';
import { UpdateTenantDto } from 'src/tenants/dto/update-tenant.dto';

export function createTenantDtoFactory(
  overrides?: Partial<CreateTenantDto>,
): CreateTenantDto {
  return {
    name: 'Empresa ABC Ltda',
    slug: 'empresa-abc',
    document: '12.345.678/0001-90',
    isActive: true,
    ...overrides,
  };
}

export function updateTenantDtoFactory(
  overrides?: Partial<UpdateTenantDto>,
): UpdateTenantDto {
  return {
    name: 'Empresa XYZ Ltda',
    slug: 'empresa-xyz',
    document: '98.765.432/0001-10',
    ...overrides,
  };
}

export function createMockTenantFactory(overrides?: Partial<Tenant>): Tenant {
  return {
    id: 1,
    name: 'Empresa ABC Ltda',
    slug: 'empresa-abc',
    document: '12.345.678/0001-90',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMockTenantResponseFactory(
  overrides?: Partial<TenantResponseDto>,
): TenantResponseDto {
  return new TenantResponseDto({
    id: 1,
    name: 'Empresa ABC Ltda',
    slug: 'empresa-abc',
    document: '12.345.678/0001-90',
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
