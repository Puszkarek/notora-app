import { Module } from '@nestjs/common';
import { UsersModule } from '@server/app/modules/users';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { NotesModule } from '@server/app/modules/notes';

@Module({
  imports: [UsersModule, NotesModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}
