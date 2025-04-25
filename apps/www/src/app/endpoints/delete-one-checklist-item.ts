import type { HttpClient } from '@angular/common/http';
import { ApiResponse, ID } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const deleteOneChecklistItem = async (
  httpClient: HttpClient,
  noteID: ID,
  checklistID: ID,
): Promise<E.Either<Error, void>> => {
  return await firstValueFrom(
    httpClient.delete<ApiResponse<void>>(`${environment.apiHost}/notes/${noteID}/item/${checklistID}`).pipe(
      map(() => {
        return E.right(void 0);
      }),
      catchError((error: unknown) => {
        return of(E.left(E.toError(error)));
      }),
    ),
  );
};
