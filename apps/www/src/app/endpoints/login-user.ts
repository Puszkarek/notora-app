import { HttpClient } from '@angular/common/http';
import { GoogleLoginResponse, googleLoginResponseCodec } from '@api-interfaces';
import * as E from 'fp-ts/es6/Either';
import { flow } from 'fp-ts/lib/function';
import { catchError, firstValueFrom, map, of } from 'rxjs';

export const loginUser = async (http: HttpClient, baseURL: string): Promise<E.Either<Error, GoogleLoginResponse>> => {
  return await firstValueFrom(
    http.post<GoogleLoginResponse>(`${baseURL}/login`, {}).pipe(
      map(flow(E.fromPredicate(googleLoginResponseCodec.is, () => new Error('Invalid response')))),
      catchError((error: unknown) => of(E.left(E.toError(error)))),
    ),
  );
};
