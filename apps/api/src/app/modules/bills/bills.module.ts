import { Module } from '@nestjs/common';
import { MenuItemsModule } from '@server/app/modules/menu-items';
import { MenusModule } from '@server/app/modules/menus';
import { PrismaModule } from '@server/app/modules/prisma';
import { RestaurantsModule } from '@server/app/modules/restaurants';
import { UsersModule } from '@server/app/modules/users';
import { BillsRepository } from '@server/app/repositories/bills';

import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
  controllers: [BillsController],
  imports: [RestaurantsModule, PrismaModule, MenusModule, MenuItemsModule, UsersModule],
  providers: [BillsRepository, BillsService],
  exports: [BillsService, BillsRepository],
})
export class BillsModule {}
