import type { HttpClient } from '@angular/common/http';
import { LoginResponse, loginCallbackResponseCodec } from '@api-interfaces';
import * as E from 'fp-ts/es6/Either';
import { flow } from 'fp-ts/lib/function';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const loginCallback = async (
  http: HttpClient,
  baseURL: string,
  code: string,
): Promise<E.Either<Error, LoginResponse>> => {
  return await firstValueFrom(
    http
      .get<LoginResponse>(`${baseURL}/login/callback`, {
        params: {
          code,
        },
      })
      .pipe(
        map(flow(E.fromPredicate(loginCallbackResponseCodec.is, () => new Error('Invalid response')))),
        catchError((error: unknown) => of(E.left(E.toError(error)))),
      ),
  );
};
