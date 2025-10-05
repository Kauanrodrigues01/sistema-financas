import { Module } from '@nestjs/common';
import { BcryptService } from 'src/services/bcrypt.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService, BcryptService],
  controllers: [UsersController],
})
export class UsersModule {}
