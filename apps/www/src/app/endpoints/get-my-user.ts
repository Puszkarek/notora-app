import type { HttpClient } from '@angular/common/http';
import { ApiResponse, User, userCodec } from '@api-interfaces';
import { environment } from '@www/environments/environment';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getMyUser = async (httpClient: HttpClient): Promise<E.Either<Error, User>> => {
  return await firstValueFrom(
    httpClient
      .get<ApiResponse<User>>(`${environment.apiHost}/users/me`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(({ data }) => {
          if (userCodec.is(data)) {
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
