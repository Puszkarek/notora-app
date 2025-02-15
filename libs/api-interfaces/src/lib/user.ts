import * as t from 'io-ts';

import { emailCodec, idCodec } from './common';

export const USER_ROLE = {
  admin: 'admin',
  cook: 'cook',
  waiter: 'waiter',
} as const;

export const userRoleCodec = t.keyof(USER_ROLE);

export const userCodec = t.readonly(
  t.type({
    id: idCodec,
    name: t.string,
    email: t.string,
    role: userRoleCodec,
  }),
);

export const updatableUserCodec = t.readonly(
  t.partial({
    name: t.string,
    role: userRoleCodec,
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
    role: userRoleCodec,
  }),
);

export type User = t.TypeOf<typeof userCodec>;
export type UpdatableUser = t.TypeOf<typeof updatableUserCodec>;
export type SelfUpdatableUser = t.TypeOf<typeof selfUpdatableUserCodec>;
export type CreatableUser = t.TypeOf<typeof creatableUserCodec>;
