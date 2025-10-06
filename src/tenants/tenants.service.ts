import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { validationMessages } from 'src/common/messages/validation-messages';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    // Validar se slug já existe
    await this.checkSlugExists(createTenantDto.slug);

    // Validar se document já existe (se fornecido)
    if (createTenantDto.document) {
      await this.checkDocumentExists(createTenantDto.document);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        document: createTenantDto.document,
        isActive: createTenantDto.isActive ?? true,
      },
    });

    return new TenantResponseDto(tenant);
  }

  async findAll(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [tenants, totalItems] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      items: tenants.map((tenant) => new TenantResponseDto(tenant)),
      meta: {
        totalItems,
        itemCount: tenants.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(validationMessages.TENANT.NOT_FOUND(id));
    }

    return new TenantResponseDto(tenant);
  }

  async update(
    id: number,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    // Verificar se tenant existe
    await this.findOne(id);

    // Validar slug se fornecido
    if (updateTenantDto.slug) {
      await this.checkSlugExists(updateTenantDto.slug, id);
    }

    // Validar document se fornecido
    if (updateTenantDto.document) {
      await this.checkDocumentExists(updateTenantDto.document, id);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    return new TenantResponseDto(tenant);
  }

  async remove(id: number): Promise<TenantResponseDto> {
    // Verificar se tenant existe
    await this.findOne(id);

    const tenant = await this.prisma.tenant.delete({
      where: { id },
    });

    return new TenantResponseDto(tenant);
  }

  async toggleActive(id: number): Promise<TenantResponseDto> {
    const tenant = await this.findOne(id);

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: !tenant.isActive },
    });

    return new TenantResponseDto(updatedTenant);
  }

  async findActive(
    paginationDto: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [tenants, totalItems] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where: { isActive: true } }),
    ]);

    return {
      items: tenants.map((tenant) => new TenantResponseDto(tenant)),
      meta: {
        totalItems,
        itemCount: tenants.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  private async checkSlugExists(
    slug: string,
    excludeId?: number,
  ): Promise<void> {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant && existingTenant.id !== excludeId) {
      throw new ConflictException(
        validationMessages.TENANT.SLUG_ALREADY_IN_USE(slug),
      );
    }
  }

  private async checkDocumentExists(
    document: string,
    excludeId?: number,
  ): Promise<void> {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { document },
    });

    if (existingTenant && existingTenant.id !== excludeId) {
      throw new ConflictException(
        validationMessages.TENANT.DOCUMENT_ALREADY_IN_USE(document),
      );
    }
  }
}
