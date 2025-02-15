import { Module } from '@nestjs/common';
import { OrganizationsModule } from '@server/app/modules/organizations';
import { PrismaModule } from '@server/app/modules/prisma';
import { UsersModule } from '@server/app/modules/users';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  imports: [PrismaModule, UsersModule, OrganizationsModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
