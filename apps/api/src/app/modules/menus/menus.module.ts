import { Module } from '@nestjs/common';
import { MenuItemsModule } from '@server/app/modules/menu-items';
import { PrismaModule } from '@server/app/modules/prisma';
import { RestaurantsModule } from '@server/app/modules/restaurants';
import { UsersModule } from '@server/app/modules/users';
import { MenusRepository } from '@server/app/repositories/menus';

import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  controllers: [MenusController],
  imports: [PrismaModule, RestaurantsModule, MenuItemsModule, UsersModule],
  providers: [MenusRepository, MenusService],
  exports: [MenusRepository, MenusService],
})
export class MenusModule {}
