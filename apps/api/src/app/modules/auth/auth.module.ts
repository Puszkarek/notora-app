import { Module } from '@nestjs/common';
import { AuthService } from '@server/app/modules/auth/auth.service';
import { PrismaModule } from '@server/app/modules/prisma';
import { UsersModule } from '@server/app/modules/users';

import { AuthController } from './auth.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
