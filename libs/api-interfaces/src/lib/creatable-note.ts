import * as t from 'io-ts';

import { creatableChecklistItemCodec } from '@api-interfaces/creatable-checklist-item';

export const creatableNoteCodec = t.readonly(
  t.intersection([
    t.type({
      label: t.string,
    }),
    t.union([
      t.type({
        type: t.literal('checklist'),
        checklist: t.array(creatableChecklistItemCodec),
      }),
      t.type({
        type: t.literal('text'),
        content: t.string,
      }),
    ]),
  ]),
);

export type CreatableNote = t.TypeOf<typeof creatableNoteCodec>;
