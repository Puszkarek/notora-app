import { Module } from '@nestjs/common';
import { FileUploaderModule } from '@server/app/modules/file-uploader';
import { PrismaModule } from '@server/app/modules/prisma';
import { RestaurantsModule } from '@server/app/modules/restaurants';
import { UsersModule } from '@server/app/modules/users';
import { MenuItemsRepository } from '@server/app/repositories/menu-items';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';

@Module({
  controllers: [MenuItemsController],
  imports: [NestjsFormDataModule, PrismaModule, RestaurantsModule, UsersModule, FileUploaderModule],
  providers: [MenuItemsRepository, MenuItemsService],
  exports: [MenuItemsRepository, MenuItemsService],
})
export class MenuItemsModule {}
