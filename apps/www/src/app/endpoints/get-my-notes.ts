import type { HttpClient } from '@angular/common/http';
import { ApiResponse, BaseNote, baseNoteCodec, CreatableNote } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getMyNotes = async (httpClient: HttpClient): Promise<E.Either<Error, Array<BaseNote>>> => {
  return await firstValueFrom(
    httpClient
      .get<ApiResponse<Array<BaseNote>>>(`${environment.apiHost}/notes`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          if (data.every(baseNoteCodec.is)) {
            return E.right(data);
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
