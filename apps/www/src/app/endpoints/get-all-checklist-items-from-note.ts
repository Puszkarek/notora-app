import type { HttpClient } from '@angular/common/http';
import { ApiResponse, ChecklistItem, checklistItemCodec, ID } from '@api-interfaces';
import { parseChecklistItem } from '@www/app/helpers/parse-checklist-item';
import { ChecklistItemEntity } from '@www/app/interfaces/checklist-item';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getAllChecklistItemsFromNote = async (
  httpClient: HttpClient,
  noteID: ID,
): Promise<E.Either<Error, Array<ChecklistItemEntity>>> => {
  return await firstValueFrom(
    httpClient
      .get<ApiResponse<Array<ChecklistItem>>>(`${environment.apiHost}/notes/${noteID}/checklist-items`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          const parsedData = data.map(item => parseChecklistItem(noteID, item));
          if (parsedData.every(checklistItemCodec.is)) {
            return E.right(parsedData);
          }
          console.error('Invalid response', data);
          return E.left(new Error('Invalid response'));
        }),
        catchError((error: unknown) => {
          return of(E.left(E.toError(error)));
        }),
      ),
  );
};
