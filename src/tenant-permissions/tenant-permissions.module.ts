import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TenantAdminGuard } from 'src/user-tenant/guards/tenant-admin.guard';
import { TenantUserGuard } from 'src/user-tenant/guards/tenant-user.guard';
import { TenantPermissionsController } from './tenant-permissions.controller';
import { TenantPermissionsService } from './tenant-permissions.service';

@Module({
  imports: [PrismaModule],
  providers: [TenantPermissionsService, TenantUserGuard, TenantAdminGuard],
  controllers: [TenantPermissionsController],
  exports: [TenantPermissionsService],
})
export class TenantPermissionsModule {}
