import { Module } from '@nestjs/common';
import { OrganizationsModule } from '@server/app/modules/organizations';
import { PrismaModule } from '@server/app/modules/prisma';
import { UsersModule } from '@server/app/modules/users';
import { RestaurantsRepository } from '@server/app/repositories/restaurants';

import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  controllers: [RestaurantsController],
  imports: [PrismaModule, UsersModule, OrganizationsModule],
  providers: [RestaurantsRepository, RestaurantsService],
  exports: [RestaurantsService, RestaurantsRepository],
})
export class RestaurantsModule {}
