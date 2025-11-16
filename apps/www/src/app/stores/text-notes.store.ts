import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { ID, UpdatableTextNote } from '@api-interfaces';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { getOneTextNote } from '@www/app/endpoints/get-one-text-note';
import { updateOneTextNote } from '@www/app/endpoints/update-one-text-note';
import * as E from 'fp-ts/es6/Either';

export type TextNoteEntity = {
  id: ID;
  content: string;
};

type StoreState = {
  isLoading: boolean;
  isLoaded: boolean;
};

const initialState: StoreState = {
  isLoading: false,
  isLoaded: false,
};

const COLLECTION_NAME = 'textNotes';

export const TextNotesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities({
    entity: type<TextNoteEntity>(),
    collection: COLLECTION_NAME,
  }),
  withComputed(store => ({
    count: computed(() => store.textNotesIds().length),
    all: computed(() => store.textNotesEntities()),
  })),
  withMethods((store, httpClient = inject(HttpClient)) => ({
    updateOne: async (noteID: ID, data: UpdatableTextNote) => {
      patchState(store, { isLoading: true });
      const result = await updateOneTextNote(httpClient, noteID, data);
      if (E.isRight(result)) {
        patchState(
          store,
          updateEntity(
            {
              id: noteID,
              changes: data,
            },
            { collection: COLLECTION_NAME },
          ),
        );
      }
      patchState(store, { isLoading: false });
      return result;
    },
    fetchOne: async (noteID: ID): Promise<E.Either<Error, TextNoteEntity>> => {
      patchState(store, { isLoading: true });

      const content = await getOneTextNote(httpClient, noteID);
      if (E.isRight(content)) {
        const entity: TextNoteEntity = {
          id: noteID,
          content: content.right.content,
        };
        patchState(store, addEntity(entity, { collection: COLLECTION_NAME }));
        patchState(store, { isLoaded: true });
        patchState(store, { isLoading: false });
        return E.right(entity);
      }

      patchState(store, { isLoading: false });
      return E.left(content.left);
    },
  })),
);
