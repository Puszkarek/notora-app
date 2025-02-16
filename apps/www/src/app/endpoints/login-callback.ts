import type { HttpClient } from '@angular/common/http';
import { LoginResponse, loginResponseCodec } from '@api-interfaces';
import * as E from 'fp-ts/es6/Either';
import { flow } from 'fp-ts/lib/function';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const loginCallback = async (
  http: HttpClient,
  baseURL: string,
  code: string,
  state: string,
  verifier: string,
): Promise<E.Either<Error, LoginResponse>> => {
  return await firstValueFrom(
    http
      .get<LoginResponse>(`${baseURL}/login/callback`, {
        params: {
          code,
          state,
          verifier,
        },
      })
      .pipe(
        map(flow(E.fromPredicate(loginResponseCodec.is, () => new Error('Invalid response')))),
        catchError((error: unknown) => of(E.left(E.toError(error)))),
      ),
  );
};
