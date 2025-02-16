/* eslint-disable @typescript-eslint/member-ordering */
import {
  BaseNote,
  ChecklistItem,
  CheckListNote,
  CreatableChecklistItem,
  CreatableNote,
  CreateOneNoteFilter,
  GetMyNotesFilter,
  GetOneNoteFilter,
  TextNote,
} from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { Exception } from '@server/app/interfaces/error';
import { NotesRepository } from '@server/app/repositories/notes';
import { pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';

@Injectable({
  scope: Scope.DEFAULT,
})
export class NotesService {
  constructor(private readonly _notesRepository: NotesRepository) {}

  public addOneChecklistItem = (
    filters: GetOneNoteFilter,
    data: CreatableChecklistItem,
  ): TaskEither<Exception, ChecklistItem> => {
    return this._notesRepository.addOneChecklistItem(filters, data);
  };

  public createOne = (filters: CreateOneNoteFilter, data: CreatableNote): TaskEither<Exception, BaseNote> => {
    return this._notesRepository.createOne(filters, data);
  };

  public getMine = (filters: GetMyNotesFilter): TaskEither<Exception, Array<BaseNote>> => {
    return pipe(filters, this._notesRepository.findMany);
  };

  public getOneWithDetails = (filters: GetOneNoteFilter): TaskEither<Exception, TextNote | CheckListNote> => {
    return pipe(filters, this._notesRepository.findOneWithDetails);
  };

  public deleteOne = (filters: GetOneNoteFilter): TaskEither<Exception, void> => {
    return pipe(filters, this._notesRepository.deleteOne);
  };
}
