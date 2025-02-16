import { Module } from '@nestjs/common';
import { UsersModule } from '@server/app/modules/users';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
