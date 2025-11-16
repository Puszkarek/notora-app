import { HttpClient } from '@angular/common/http';
import { ID, UpdatableTextNote } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const updateOneTextNote = async (
  httpClient: HttpClient,
  noteID: ID,
  data: UpdatableTextNote,
): Promise<E.Either<Error, void>> => {
  return await firstValueFrom(
    httpClient
      .patch<void>(`${environment.apiHost}/notes/${noteID}`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(() => {
          return E.right(undefined);
        }),
        catchError((error: unknown) => {
          return of(E.left(E.toError(error)));
        }),
      ),
  );
};
