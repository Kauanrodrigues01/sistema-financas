import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Empresa ABC Ltda' })
  name: string;

  @ApiProperty({ example: 'empresa-abc' })
  slug: string;

  @ApiProperty({ example: '12.345.678/0001-90', nullable: true })
  document: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-10-05T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-05T10:00:00.000Z' })
  updatedAt: Date;

  constructor(tenant: Tenant) {
    this.id = tenant.id;
    this.name = tenant.name;
    this.slug = tenant.slug;
    this.document = tenant.document;
    this.isActive = tenant.isActive;
    this.createdAt = tenant.createdAt;
    this.updatedAt = tenant.updatedAt;
  }
}
