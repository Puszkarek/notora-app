import type { HttpClient } from '@angular/common/http';
import { ApiResponse, BaseNote, baseNoteCodec, CreatableNote } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const createOneNote = async (
  httpClient: HttpClient,
  creatableNote: CreatableNote,
): Promise<E.Either<Error, BaseNote>> => {
  return await firstValueFrom(
    httpClient
      .post<ApiResponse<BaseNote>>(`${environment.apiHost}/notes`, creatableNote, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          if (baseNoteCodec.is(data)) {
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
