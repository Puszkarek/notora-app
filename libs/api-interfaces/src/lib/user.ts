import * as t from 'io-ts';

import { emailCodec, idCodec } from './common';

export const userCodec = t.readonly(
  t.type({
    id: idCodec,
    name: t.string,
    email: t.string,
  }),
);

export const updatableUserCodec = t.readonly(
  t.partial({
    name: t.string,
  }),
);

export const selfUpdatableUserCodec = t.readonly(
  t.partial({
    name: t.union([t.string, t.undefined]),
  }),
);

export const creatableUserCodec = t.readonly(
  t.type({
    name: t.string,
    email: emailCodec,
  }),
);

export type User = t.TypeOf<typeof userCodec>;
export type UpdatableUser = t.TypeOf<typeof updatableUserCodec>;
export type SelfUpdatableUser = t.TypeOf<typeof selfUpdatableUserCodec>;
export type CreatableUser = t.TypeOf<typeof creatableUserCodec>;
