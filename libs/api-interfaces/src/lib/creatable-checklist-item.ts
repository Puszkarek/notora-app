import * as t from 'io-ts';

export const creatableChecklistItemCodec = t.readonly(
  t.type({
    label: t.string,
  }),
);

export type CreatableChecklistItem = t.TypeOf<typeof creatableChecklistItemCodec>;
