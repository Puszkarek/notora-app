import {
  ApiResponse,
  BaseNote,
  ChecklistItem,
  CheckListNote,
  creatableChecklistItemCodec,
  creatableNoteCodec,
  TextNote,
  UpdatableChecklistItem,
  updatableChecklistItemCodec,
} from '@api-interfaces';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@server/app/guards/auth';
import { executeTaskEither, UserParam } from '@server/app/helpers/controller';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { NotesService } from '@server/app/modules/notes/notes.service';
import { flow, pipe } from 'fp-ts/lib/function';
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

  @Patch(':noteID/share')
  @UseGuards(AuthGuard)
  public async shareOne(@Param('noteID') noteID: string, @UserParam() loggedUser: LoggedUser): Promise<void> {
    const task = pipe(
      this._notesService.shareOne({
        noteID,
        userID: loggedUser.id,
      }),
      executeTaskEither,
    );

    await task();
  }

  @Patch(':noteID/item')
  @UseGuards(AuthGuard)
  public async addOneChecklistItem(
    @Param('noteID') noteID: string,
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

  @Patch(':noteID/item/:itemID')
  @UseGuards(AuthGuard)
  public async updateOneChecklistItem(
    @Param('noteID') noteID: string,
    @Param('itemID') checklistItemID: string,
    @UserParam() loggedUser: LoggedUser,
    @Body() body: UpdatableChecklistItem,
  ): Promise<ApiResponse<ChecklistItem>> {
    const task = pipe(
      TE.tryCatch(
        async () => ({
          ...body,
          completedAt: body.completedAt ? new Date(body.completedAt) : body.completedAt,
        }),
        EXCEPTIONS.to.bad,
      ),
      TE.chain(flow(TE.fromPredicate(updatableChecklistItemCodec.is, () => EXCEPTIONS.bad('Invalid Body')))),
      TE.chain(body =>
        this._notesService.updateOneChecklistItem(
          {
            noteID,
            userID: loggedUser.id,
            checklistItemID,
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

  @Get(':noteID/checklist-items')
  @UseGuards(AuthGuard)
  public async getAllChecklistItemsFromNote(
    @Param('noteID') noteID: string,
    @UserParam() { id }: LoggedUser,
  ): Promise<ApiResponse<Array<ChecklistItem>>> {
    const task = pipe(
      this._notesService.getAllChecklistItemsFromNote({
        noteID,
        userID: id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }

  @Delete(':noteID')
  @UseGuards(AuthGuard)
  public async deleteOne(@Param('noteID') noteID: string, @UserParam() { id }: LoggedUser): Promise<ApiResponse<void>> {
    const task = pipe(
      this._notesService.deleteOne({
        noteID,
        userID: id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }

  @Delete(':noteID/item/:itemID')
  @UseGuards(AuthGuard)
  public async deleteOneChecklistItems(
    @Param('noteID') noteID: string,
    @Param('itemID') checklistItemID: string,
    @UserParam() { id }: LoggedUser,
  ): Promise<ApiResponse<void>> {
    const task = pipe(
      this._notesService.deleteOneChecklistItems({
        noteID,
        checklistItemID,
        userID: id,
      }),
      executeTaskEither,
    );

    return { data: await task() };
  }
}
