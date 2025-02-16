import {
  AuthToken,
  BaseNote,
  ChecklistItem,
  CheckListNote,
  CreatableChecklistItem,
  CreatableNote,
  CreateOneNoteFilter,
  GetMyNotesFilter,
  GetOneNoteFilter,
  ID,
  TextNote,
  UpdatableChecklistItem,
  UpdateOneNoteChecklistItemFilter,
  User,
} from '@api-interfaces';
import { Injectable } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { PrismaService } from '@server/app/modules/prisma';
import { omitUndefined } from '@utils';
import { taskEither as TE, taskOption as TO } from 'fp-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import { uuidv7 } from 'uuidv7';

export type FindByToken = (token: AuthToken) => TaskOption<User>;

@Injectable()
export class NotesRepository {
  private readonly _selectParameters = {
    id: true,
    label: true,
    type: true,
  };

  constructor(private readonly _prismaClient: PrismaService) {}

  // * Find

  public readonly findOneWithDetails = ({
    userID,
    noteID,
  }: GetOneNoteFilter): TE.TaskEither<Exception, CheckListNote | TextNote> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.baseNote.findUnique({
          select: {
            ...this._selectParameters,
            checklistNote: {
              select: {
                items: true,
              },
            },
            textNote: {
              select: {
                content: true,
              },
            },
          },
          where: {
            id: noteID,
            users: {
              some: {
                id: userID,
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('Note not found')))),
      TE.map(rawData => {
        const data: TextNote | CheckListNote =
          rawData.type === 'checklist'
            ? {
                id: rawData.id,
                label: rawData.label,
                type: rawData.type,
                items: rawData.checklistNote?.items ?? [],
              }
            : {
                id: rawData.id,
                label: rawData.label,
                type: rawData.type,
                content: rawData.textNote?.content ?? '',
              };

        return data;
      }),
    );
  };

  public readonly findMany = ({ userID }: GetMyNotesFilter): TE.TaskEither<Exception, Array<BaseNote>> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.baseNote.findMany({
          select: this._selectParameters,
          where: {
            users: {
              some: {
                id: userID,
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
    );
  };

  // * Crud
  public readonly updateOneChecklistItem = (
    { userID, noteID, checklistItemID }: UpdateOneNoteChecklistItemFilter,
    data: UpdatableChecklistItem,
  ): TE.TaskEither<Exception, ChecklistItem> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.checklistItem.update({
          select: {
            id: true,
            label: true,
            createdBy: true,
            createdAt: true,

            completedAt: true,
          },
          where: {
            id: checklistItemID,
            note: {
              id: noteID,
              baseNote: {
                users: {
                  some: {
                    id: userID,
                  },
                },
              },
            },
          },
          data: omitUndefined(data),
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
    );
  };

  public readonly shareOne = ({ userID, noteID }: GetOneNoteFilter): TE.TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        await this._prismaClient.baseNote.update({
          select: { id: true },
          where: { id: noteID },
          data: {
            users: {
              connect: {
                id: userID,
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
    );
  };

  public readonly addOneChecklistItem = (
    { userID, noteID }: GetOneNoteFilter,
    data: CreatableChecklistItem,
  ): TE.TaskEither<Exception, ChecklistItem> => {
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.checklistItem.create({
          select: {
            id: true,
            label: true,
            createdBy: true,
            createdAt: true,

            completedAt: true,
          },
          data: {
            id: uuidv7(),
            label: data.label,
            createdBy: userID,
            createdAt: new Date(),
            completedAt: null,
            noteID,
          },
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
    );
  };

  public readonly createOne = (
    { userID }: CreateOneNoteFilter,
    data: CreatableNote,
  ): TE.TaskEither<Exception, BaseNote> => {
    const id = uuidv7();
    return pipe(
      TE.tryCatch(async () => {
        return await this._prismaClient.baseNote.create({
          select: this._selectParameters,
          data: getCreatableData(id, userID, data),
        });
      }, EXCEPTIONS.to.bad),
      TE.chain(flow(TE.fromNullable(EXCEPTIONS.notFound('User not found')))),
    );
  };

  public readonly deleteOne = ({ userID, noteID }: GetOneNoteFilter): TE.TaskEither<Exception, void> => {
    return pipe(
      TE.tryCatch(async () => {
        await this._prismaClient.baseNote.delete({
          select: {
            id: true,
          },
          where: {
            id: noteID,
            users: {
              some: {
                id: userID,
              },
            },
          },
        });
      }, EXCEPTIONS.to.bad),
    );
  };
}

const getCreatableData = (id: ID, userID: ID, data: CreatableNote) => {
  const baseNote = {
    id,
    label: data.label,
    type: data.type,
    createdBy: userID,
    users: {
      connect: {
        id: userID,
      },
    },
  };

  if (data.type === 'checklist') {
    return {
      ...baseNote,
      checklistNote: {
        create: {
          id,
          items: {
            create: [],
          },
        },
      },
    };
  }
  return {
    ...baseNote,
    textNote: {
      create: {
        id,
        content: '',
      },
    },
  };
};
