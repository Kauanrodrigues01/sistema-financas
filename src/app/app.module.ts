import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TenantPermissionsModule } from 'src/tenant-permissions/tenant-permissions.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { UserTenantModule } from 'src/user-tenant/user-tenant.module';
import { UsersModule } from 'src/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    UserTenantModule,
    TenantPermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
