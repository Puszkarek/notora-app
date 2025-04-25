import { HttpClient } from '@angular/common/http';
import { computed, inject, Signal } from '@angular/core';
import { BaseNote, CreatableNote, ID } from '@api-interfaces';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntities, addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { createOneNote } from '@www/app/endpoints/create-one-note';
import * as E from 'fp-ts/es6/Either';
import * as O from 'fp-ts/es6/Option';
import { getMyNotes } from '@www/app/endpoints/get-my-notes';
import { deleteOneNote } from '@www/app/endpoints/delete-one-note';
import { shareOneNote } from '@www/app/endpoints/share-one-note';

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

    shareOne: async (id: string): Promise<E.Either<Error, void>> => {
      return await shareOneNote(httpClient, id);
    },
    load: async (): Promise<E.Either<Error, Array<BaseNote>>> => {
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
    getOneFromCache: (id: ID): Signal<O.Option<BaseNote>> =>
      computed(() => {
        const note = store.notesEntityMap()[id];
        return O.fromNullable(note);
      }),
    deleteOne: async (id: string): Promise<E.Either<Error, void>> => {
      const either = await deleteOneNote(httpClient, id);

      if (E.isRight(either)) {
        patchState(
          store,
          removeEntity(id, {
            collection: COLLECTION_NAME,
          }),
        );
      }

      return either;
    },
  })),
);
