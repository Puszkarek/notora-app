import { HttpClient } from '@angular/common/http';
import { User, userCodec } from '@api-interfaces';
import * as E from 'fp-ts/es6/Either';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const getMyUser = async (httpClient: HttpClient, baseURL: string): Promise<E.Either<Error, User>> => {
  return await firstValueFrom(
    httpClient
      .get<User>(`${baseURL}/users/me`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map(response => {
          if (userCodec.is(response)) {
            return E.right(response);
          }
          console.error('Invalid response', response);
          return E.left(new Error('Invalid response'));
        }),
        catchError((error: unknown) => {
          return of(E.left(E.toError(error)));
        }),
      ),
  );
};
