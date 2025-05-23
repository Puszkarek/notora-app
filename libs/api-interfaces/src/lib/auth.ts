import * as t from 'io-ts';
import { date } from 'io-ts-types';

import { userCodec } from './user';

export const authTokenCodec = t.string;

export const authTokenMetadataCodec = t.type({
  expireAt: date,
  userID: t.string,
});

export const loginCallbackResponseCodec = t.type({
  loggedUser: userCodec,
  token: authTokenCodec,
});

export type AuthToken = t.TypeOf<typeof authTokenCodec>;
export type AuthTokenMetadata = t.TypeOf<typeof authTokenMetadataCodec>;
export type LoginResponse = t.TypeOf<typeof loginCallbackResponseCodec>;
