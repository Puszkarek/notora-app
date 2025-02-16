import type { ID } from '../common';

export type UpdateOneNoteChecklistItemFilter = {
  readonly noteID: ID;
  readonly checklistItemID: ID;
  readonly userID: ID;
};

export type GetOneNoteFilter = {
  readonly noteID: ID;
  readonly userID: ID;
};

export type CreateOneNoteFilter = {
  readonly userID: ID;
};

export type GetMyNotesFilter = {
  readonly userID: ID;
};
