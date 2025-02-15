/* eslint-disable @typescript-eslint/member-ordering */
import { GoogleLoginResponse, LoginResponse } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { generateToken } from '@server/app/helpers/token';
import { Exception } from '@server/app/interfaces/error';
import { UsersRepository } from '@server/app/repositories/users';
import { environment } from '@server/environments/environment';
import { isString } from '@utils';
import { fetchGoogleProfile, getGoogleAccessToken, getGoogleConsentUrl } from 'express-authenticators';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

@Injectable({
  scope: Scope.DEFAULT,
})
export class AuthService {
  constructor(private readonly _usersRepository: UsersRepository) {}

  public readonly loginMe = (): TaskEither<Exception, GoogleLoginResponse> => {
    return pipe(
      TE.tryCatch(async () => {
        const { url, state } = await getGoogleConsentUrl({
          clientID: environment.google.clientID,
          redirectUri: `${environment.adminURL}/login/callback`,
        });

        return { url, verifier: state.verifier };
      }, EXCEPTIONS.to.bad),
    );
  };

  public readonly loginCallback = (
    code: string,
    state: string,
    verifier: string,
  ): TaskEither<Exception, LoginResponse> => {
    return pipe(
      // * Get Access Token
      TE.tryCatch(
        async () => {
          const data = await getGoogleAccessToken(
            {
              clientID: environment.google.clientID,
              clientSecret: environment.google.clientSecret,
              redirectUri: `${environment.adminURL}/login/callback`,
            },
            {
              state,
              verifier,
            },
            {
              code,
              state,
            },
          );

          return data.access_token;
        },
        () => EXCEPTIONS.forbidden('Failed to get access token'),
      ),
      TE.chain(accessToken =>
        TE.tryCatch(async () => {
          const { email } = await fetchGoogleProfile(accessToken);
          return email;
        }, EXCEPTIONS.to.bad),
      ),
      TE.filterOrElse(isString, () => EXCEPTIONS.notFound('User email not found')),
      TE.chain(email =>
        TE.tryCatch(
          async () => {
            // * Register user if not it does not exist
            const userO = await this._usersRepository.findByEmail(email)();
            if (O.isNone(userO)) {
              // * Create the User
              const newUserE = await this._usersRepository.register(email)();

              if (E.isLeft(newUserE)) {
                // eslint-disable-next-line functional/no-throw-statements
                throw new Error(newUserE.left.message);
              }

              return newUserE.right;
            }

            return userO.value;
          },
          () => EXCEPTIONS.bad('Failed to create user'),
        ),
      ),
      TE.chain(loggedUser =>
        pipe(
          generateToken(loggedUser.id),
          TE.map(token => ({
            loggedUser,
            token,
          })),
        ),
      ),
    );
  };
}
