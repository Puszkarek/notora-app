import { AuthToken, LoginResponse, User } from '@api-interfaces';
import { EXCEPTIONS } from '@server/app/helpers/error';
import { generateToken, parseToken } from '@server/app/helpers/token';
import { Exception } from '@server/app/interfaces/error';
import { FindByToken } from '@server/app/repositories/users';
import { taskEither as TE } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';

/**
 * Fetch the repository to find the user with the given token
 *
 * @param token - The token to use to find the {@link User}
 * @returns The {@link User} that belongs to the token, otherwise the error that happened
 */
export const makeGetMe =
  (findByToken: FindByToken) =>
  (token: AuthToken): TaskEither<Exception, User> => {
    return pipe(
      // * Try to find the user by token
      token,
      findByToken,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('User not found with the given ID')),
    );
  };

/**
 * Generate a new token using the old one as base
 *
 * In case the token has expired it'll fails
 *
 * @param token - The old token to get the info
 * @returns A new Token, otherwise the error that happened
 */
export const makeRefreshToken =
  (findByToken: FindByToken) =>
  (rawToken: AuthToken): TaskEither<Exception, LoginResponse> => {
    const getLoggedUser = pipe(
      rawToken,
      findByToken,
      TE.fromTaskOption(() => EXCEPTIONS.notFound('No user found with the given Email')),
    );

    return pipe(
      // Search by the user using his token
      rawToken,
      // * Parse the token to see if it's valid
      parseToken,
      // * Get the user from token
      TE.bind('user', () => getLoggedUser),
      // * Generate the new token
      TE.bind('token', ({ user }) => generateToken(user.id)),
      // * Map the result
      TE.map(({ user, token }) => ({ token, loggedUser: user })),
    );
  };

/**
 * Check if the given token is valid
 *
 * @param token - The token to check
 * @returns On success it'll be void, otherwise the error that happened
 */
export const makeValidateToken =
  () =>
  // eslint-disable-next-line unicorn/consistent-function-scoping
  (token: AuthToken): TaskEither<Exception, void> => {
    return pipe(
      // * Parse the token
      token,
      parseToken,
      // Map the `Right` value to `void`
      TE.chain(() => TE.of(void 0)),
    );
  };
