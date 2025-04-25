import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { ChecklistItem, CreatableChecklistItem, ID, UpdatableChecklistItem } from '@api-interfaces';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntities, addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { addOneChecklistItem } from '@www/app/endpoints/add-one-checklist-item';
import { deleteOneChecklistItem } from '@www/app/endpoints/delete-one-checklist-item';
import { getAllChecklistItemsFromNote } from '@www/app/endpoints/get-all-checklist-items-from-note';
import { updateOneChecklistItem } from '@www/app/endpoints/update-one-checklist-item';
import { ChecklistItemEntity } from '@www/app/interfaces/checklist-item';
import * as E from 'fp-ts/es6/Either';

type StoreState = {
  isLoading: boolean;
  isLoaded: boolean;
};

const initialState: StoreState = {
  isLoading: false,
  isLoaded: false,
};

const COLLECTION_NAME = 'checklistItems';

export const ChecklistItemsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities({
    entity: type<ChecklistItemEntity>(),
    collection: COLLECTION_NAME,
  }),
  withComputed(store => ({
    count: computed(() => store.checklistItemsIds().length),
    all: computed(() => store.checklistItemsEntities()),
  })),
  withMethods((store, httpClient = inject(HttpClient)) => ({
    updateOne: async (noteID: string, checklistItemID: ID, data: UpdatableChecklistItem) => {
      patchState(store, { isLoading: true });
      const result = await updateOneChecklistItem(httpClient, noteID, checklistItemID, data);
      if (E.isRight(result)) {
        patchState(
          store,
          updateEntity(
            {
              id: checklistItemID,
              changes: {
                ...data,
              },
            },
            { collection: COLLECTION_NAME },
          ),
        );
      }
      patchState(store, { isLoading: false });
      return result;
    },
    addOne: async (noteID: ID, data: CreatableChecklistItem) => {
      patchState(store, { isLoading: true });
      const result = await addOneChecklistItem(httpClient, noteID, data);
      if (E.isRight(result)) {
        patchState(store, addEntity(result.right, { collection: COLLECTION_NAME }));
      }
      patchState(store, { isLoading: false });
      return result;
    },
    deleteOne: async (noteID: string, checklistItemID: string) => {
      patchState(store, { isLoading: true });
      const result = await deleteOneChecklistItem(httpClient, noteID, checklistItemID);
      if (E.isRight(result)) {
        patchState(store, removeEntity(checklistItemID, { collection: COLLECTION_NAME }));
      }
      patchState(store, { isLoading: false });
      return result;
    },
    fetchAllFromNote: async (noteID: string): Promise<E.Either<Error, Array<ChecklistItem>>> => {
      patchState(store, { isLoading: true });

      const items = await getAllChecklistItemsFromNote(httpClient, noteID);
      if (E.isRight(items)) {
        patchState(
          store,
          addEntities(items.right, {
            collection: COLLECTION_NAME,
          }),
        );
      }

      patchState(store, { isLoading: false });
      patchState(store, { isLoaded: true });

      return items;
    },
  })),
);
