import { AuthToken } from '@api-interfaces';
import { EXCEPTIONS, extractError } from '@server/app/helpers/error';
import { Exception } from '@server/app/interfaces/error';
import { environment } from '@server/environments/environment';
import { taskEither as TE } from 'fp-ts';
import * as E from 'fp-ts/lib/Either';
import { flow, pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import * as jose from 'jose';

const tokenPayloadCodec = t.type({
  userID: t.string,
  organizationId: t.string,
});

/** The key that we use to encrypt the token, so that it just can be read at our backend */
const TOKEN_SECRET = new TextEncoder().encode(environment.tokenSecret);

/**
 * Parses the given {@link AuthToken} and returns the results
 *
 * P.S: it'll catch an error when:
 *
 * 1. The format be wrong
 * 2. When the token secret doesn't match
 * 3. Or when it expire
 *
 * @param JWT - The token to parse
 * @returns On success the parsed token, otherwise the error that happened
 */
export const parseToken = (JWT: AuthToken): TaskEither<Exception, jose.JWTVerifyResult> => {
  return TE.tryCatch(
    async () => {
      const parsedJWT = await jose.jwtVerify(JWT, TOKEN_SECRET, {
        issuer: 'urn:example:issuer',
        audience: 'urn:example:audience',
      });
      return parsedJWT;
    },
    error => {
      return EXCEPTIONS.bad(extractError(error).message);
    },
  );
};

/**
 * Parses the given {@link AuthToken} and returns the results
 *
 * P.S: it'll catch an error when:
 *
 * 1. The format be wrong
 * 2. When the token secret doesn't match
 * 3. Or when it expire
 *
 * @param JWT - The token to parse
 * @returns On success the parsed token, otherwise the error that happened
 */
export const getUserDataFromToken = (
  JWT: AuthToken,
): TaskEither<Exception, { userId: string; organizationId: string }> => {
  return pipe(
    TE.tryCatch(
      async () => {
        const parsedJWT = await jose.jwtVerify(JWT, TOKEN_SECRET, {
          issuer: 'urn:example:issuer',
          audience: 'urn:example:audience',
        });
        return parsedJWT;
      },
      () => {
        return EXCEPTIONS.bad('Token with an invalid format');
      },
    ),
    TE.map(token => token.payload),
    TE.chain(flow(TE.fromPredicate(tokenPayloadCodec.is, () => EXCEPTIONS.bad('Payload with an invalid format')))),
    TE.map(token => token.userID),
  );
};

/**
 * Generates and encrypt a token for the related user
 *
 * @param userID - The user {@link ID} to attach in the token
 * @returns The generated token
 */
export const generateToken = (userID: string): TaskEither<Exception, AuthToken> => {
  return TE.tryCatch(
    async () =>
      await new jose.SignJWT({ userID })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:example:issuer') // TODO: i don't know what really is it
        .setAudience('urn:example:audience')
        .setExpirationTime('1d')
        .sign(TOKEN_SECRET),
    error => EXCEPTIONS.bad(extractError(error).message),
  );
};

/**
 * Get the token key from `Bearer`
 *
 * @param bearer - The `Bearer` token (e.g: `Bearer my-token-encrypted`)
 * @returns The encrypted key from `Bearer` value
 */
export const parseRawToken = (bearer: string | undefined): E.Either<Exception, AuthToken> => {
  return pipe(
    // * Check if it's a string
    // * Validate if the request has the token
    bearer,
    E.fromPredicate(t.string.is, () => EXCEPTIONS.bad('Missing token')),
    // * Get the piece with the encrypted token
    E.map(value => value.split(' ')[1]),
    // * Filter possible falsy values
    E.filterOrElse(
      (value): value is string => t.string.is(value) && value.trim().length > 0, // Needs to be a string and not be empty
      () => EXCEPTIONS.unauthorized('Missing authentication token'),
    ),
  );
};
