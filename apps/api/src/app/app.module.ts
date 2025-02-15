import { Module } from '@nestjs/common';
import { MenuItemsModule } from '@server/app/modules/menu-items';
import { MenusModule } from '@server/app/modules/menus';
import { PaymentsModule } from '@server/app/modules/payments';
import { UsersModule } from '@server/app/modules/users';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { BillsModule } from './modules/bills';
import { RestaurantsModule } from './modules/restaurants';

@Module({
  imports: [UsersModule, PaymentsModule, AuthModule, RestaurantsModule, BillsModule, MenusModule, MenuItemsModule],
  controllers: [AppController],
})
export class AppModule {}
