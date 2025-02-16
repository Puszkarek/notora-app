import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/app/modules/prisma';
import { UsersRepository } from '@server/app/repositories/users';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  imports: [PrismaModule],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
