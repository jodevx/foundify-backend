import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaUsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
