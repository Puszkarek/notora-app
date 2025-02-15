import { Module } from '@nestjs/common';
import { OrganizationsModule } from '@server/app/modules/organizations';
import { PrismaModule } from '@server/app/modules/prisma';
import { UsersRepository } from '@server/app/repositories/users';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  imports: [PrismaModule, OrganizationsModule],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
