/* eslint-disable @typescript-eslint/member-ordering */
import { LoginResponse } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { getGoogleTokensFromCode } from '@server/app/helpers/get-google-tokens-from-code';
import { generateToken } from '@server/app/helpers/token';
import { Exception } from '@server/app/interfaces/error';
import { UsersRepository } from '@server/app/repositories/users';
import { environment } from '@server/environments/environment';
import { isString } from '@utils';
import { fetchGoogleProfile } from 'express-authenticators';
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

  public readonly loginCallback = (code: string): TaskEither<Exception, LoginResponse> => {
    return pipe(
      // * Get Access Token
      getGoogleTokensFromCode(
        code,
        environment.google.clientID,
        environment.google.clientSecret,
        `${environment.wwwURL}/login/callback`,
      ),
      TE.chain(({ access_token }) =>
        TE.tryCatch(async () => {
          const { email } = await fetchGoogleProfile(access_token);
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
