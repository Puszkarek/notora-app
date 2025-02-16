import {
  ApiResponse,
  BaseNote,
  ChecklistItem,
  CheckListNote,
  creatableChecklistItemCodec,
  creatableNoteCodec,
  TextNote,
} from '@api-interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { NotesService } from '@server/app/modules/notes/notes.service';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

@Controller('notes')
export class NotesController {
  constructor(private readonly _notesService: NotesService) {}

  @Post('')
  @UseGuards(AuthGuard)
  public async createOne(@UserParam() loggedUser: LoggedUser, @Body() body: unknown): Promise<ApiResponse<BaseNote>> {
    const task = pipe(
      body,
      TE.fromPredicate(creatableNoteCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(body =>
        this._notesService.createOne(
          {
            userID: loggedUser.id,
          },
          body,
        ),
      ),
      executeTaskEither,
    );

    return { data: await task() };
  }

  @Patch(':id/item')
  @UseGuards(AuthGuard)
  public async addOneChecklistItem(
    @Param('id') noteID: string,
    @UserParam() loggedUser: LoggedUser,
    @Body() body: unknown,
  ): Promise<ApiResponse<ChecklistItem>> {
    const task = pipe(
      body,
      TE.fromPredicate(creatableChecklistItemCodec.is, () => EXCEPTIONS.bad('Invalid Body')),
      TE.chain(body =>
        this._notesService.addOneChecklistItem(
          {
            noteID,
            userID: loggedUser.id,
          },
          body,
        ),
      ),
      executeTaskEither,
    );

    return { data: await task() };
  }

  // * Getters

  @Get('')
  @UseGuards(AuthGuard)
  public async getMine(@UserParam() loggedUser: LoggedUser): Promise<ApiResponse<Array<BaseNote>>> {
    const task = pipe(
      this._notesService.getMine({
        userID: loggedUser.id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  public async getOneWithDetails(
    @Param('id') noteID: string,
    @UserParam() { id }: LoggedUser,
  ): Promise<ApiResponse<CheckListNote | TextNote>> {
    const task = pipe(
      this._notesService.getOneWithDetails({
        noteID,
        userID: id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  public async deleteOne(@Param('id') noteID: string, @UserParam() { id }: LoggedUser): Promise<ApiResponse<void>> {
    const task = pipe(
      this._notesService.deleteOne({
        noteID,
        userID: id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }
}
