import type { HttpClient } from '@angular/common/http';
import { ID } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const shareOneNote = async (httpClient: HttpClient, noteID: ID): Promise<E.Either<Error, void>> => {
  return await firstValueFrom(
    httpClient
      .patch(`${environment.apiHost}/notes/${noteID}/share`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(() => E.right(void 0)),
        catchError((error: unknown) => {
          return of(E.left(E.toError(error)));
        }),
      ),
  );
};
