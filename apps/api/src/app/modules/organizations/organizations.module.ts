import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/app/modules/prisma';
import { OrganizationsRepository } from '@server/app/repositories/organizations';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationsRepository],
  exports: [OrganizationsRepository],
})
export class OrganizationsModule {}
