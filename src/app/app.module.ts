import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { UsersModule } from 'src/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, TenantsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
