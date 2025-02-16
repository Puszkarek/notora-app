/* eslint-disable @typescript-eslint/member-ordering */
import { AuthToken, GetOneUserFilter, User } from '@api-interfaces';
import { Injectable, Scope } from '@nestjs/common';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { parseToken } from '@server/app/helpers/token';
import { Exception } from '@server/app/interfaces/error';
import { LoggedUser } from '@server/app/interfaces/request';
import { UsersRepository } from '@server/app/repositories/users';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { TaskOption } from 'fp-ts/lib/TaskOption';
import * as TO from 'fp-ts/TaskOption';
import * as t from 'io-ts';

import { makeGetMe, makeRefreshToken, makeValidateToken } from './operations';

@Injectable({
  scope: Scope.DEFAULT,
})
export class UsersService {
  /**
   * Parse the given token and try to find an {@link User} with that
   *
   * @param token - The token that belongs to the user
   * @returns An {@link Option} containing the found `User` or nothing
   */
  private readonly _findByToken = (token: AuthToken): TaskOption<User> => {
    return pipe(
      // * Parse the token
      token,
      parseToken,
      TO.fromTaskEither,
      // * Extract the `userID` from payload
      TO.chain(({ payload: { userID } }) => TO.fromNullable(t.string.is(userID) ? userID : null)), // TODO: improve validation
      // * Try to find the user
      TO.chain(id => pipe(this._usersRepository.findByID(id), TO.fromTaskEither)),
    );
  };

  public readonly get = {
    me: makeGetMe(this._findByToken),
  };

  public readonly token = {
    refresh: makeRefreshToken(this._findByToken),
    validate: makeValidateToken(),
  };

  constructor(private readonly _usersRepository: UsersRepository) {}

  public getOne = (filters: GetOneUserFilter): TaskEither<Exception, User> => {
    return pipe(filters, this._usersRepository.findOne);
  };

  public getMinimalUser = (userID: string): TaskEither<Exception, LoggedUser> =>
    pipe(
      userID,
      this._usersRepository.findMinimalByID,
      TE.fromTaskOption(() => EXCEPTIONS.notFound(`Not able to find the user with the given ID: ${userID}`)),
    );
}
