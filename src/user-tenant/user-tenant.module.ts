import { Module } from '@nestjs/common';
import { BcryptService } from 'src/services/bcrypt.service';
import { TenantAdminGuard } from './guards/tenant-admin.guard';
import { TenantIsolationGuard } from './guards/tenant-isolation.guard';
import { TenantUserGuard } from './guards/tenant-user.guard';
import { UserTenantController } from './user-tenant.controller';
import { UserTenantService } from './user-tenant.service';

@Module({
  providers: [
    UserTenantService,
    BcryptService,
    TenantUserGuard,
    TenantAdminGuard,
    TenantIsolationGuard,
  ],
  controllers: [UserTenantController],
  exports: [UserTenantService],
})
export class UserTenantModule {}
