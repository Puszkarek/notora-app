import * as t from 'io-ts';
import { date } from 'io-ts-types';

export const updatableChecklistItemCodec = t.readonly(
  t.partial({
    label: t.string,
    completedAt: t.union([date, t.null]),
  }),
);

export type UpdatableChecklistItem = t.TypeOf<typeof updatableChecklistItemCodec>;
