import type { HttpClient } from '@angular/common/http';
import { ApiResponse, ChecklistItem, checklistItemCodec, CreatableChecklistItem, ID } from '@api-interfaces';
import { parseChecklistItem } from '@www/app/helpers/parse-checklist-item';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const addOneChecklistItem = async (
  httpClient: HttpClient,
  noteID: ID,
  data: CreatableChecklistItem,
): Promise<E.Either<Error, ChecklistItem>> => {
  return await firstValueFrom(
    httpClient
      .patch<ApiResponse<ChecklistItem>>(`${environment.apiHost}/notes/${noteID}/item`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          const parsedData = parseChecklistItem(data);
          if (checklistItemCodec.is(parsedData)) {
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
