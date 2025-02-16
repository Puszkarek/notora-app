import { HttpClient } from '@angular/common/http';
import { computed, inject, Signal } from '@angular/core';
import { BaseNote, CreatableNote } from '@api-interfaces';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntities, addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { createOneNote } from '@www/app/endpoints/create-one-note';
import * as E from 'fp-ts/es6/Either';
import { getMyNotes } from '@www/app/endpoints/get-my-notes';

type StoreState = {
  isLoading: boolean;
  isLoaded: boolean;
};

const initialState: StoreState = {
  isLoading: false,
  isLoaded: false,
};

const COLLECTION_NAME = 'notes';

export const NotesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities({
    entity: type<BaseNote>(),
    collection: COLLECTION_NAME,
  }),
  withComputed(store => ({
    count: computed(() => store.notesIds().length),
    all: computed(() => {
      return store.notesEntities();
    }),
  })),
  withMethods((store, httpClient = inject(HttpClient)) => ({
    createOne: async (data: CreatableNote) => {
      const entity = await createOneNote(httpClient, data);
      if (E.isRight(entity)) {
        patchState(store, addEntity(entity.right, { collection: COLLECTION_NAME }));
      }

      return entity;
    },
    fetchMineFromCache: async (): Promise<E.Either<Error, Array<BaseNote>>> => {
      patchState(store, { isLoading: true });

      const notes = await getMyNotes(httpClient);

      if (E.isRight(notes)) {
        patchState(
          store,
          addEntities(notes.right, {
            collection: COLLECTION_NAME,
          }),
        );
      }

      patchState(store, { isLoading: false });
      patchState(store, { isLoaded: true });

      return notes;
    },
  })),
);
