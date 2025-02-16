import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/app/modules/prisma';

import { NotesService } from './notes.service';
import { NotesController } from '@server/app/modules/notes/notes.controller';
import { NotesRepository } from '@server/app/repositories/notes';
import { UsersModule } from '@server/app/modules/users';

@Module({
  controllers: [NotesController],
  imports: [UsersModule, PrismaModule],
  providers: [NotesRepository, NotesService],
  exports: [NotesService, NotesRepository],
})
export class NotesModule {}
