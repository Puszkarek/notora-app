import * as t from 'io-ts';

import { idCodec } from './common';

export const baseNoteCodec = t.readonly(
  t.type({
    id: idCodec,
    createdBy: idCodec,
    label: t.string,
    createdAt: t.string,
    updatedAt: t.string,
    type: t.union([t.literal('checklist'), t.literal('text')]),
  }),
);

export type BaseNote = t.TypeOf<typeof baseNoteCodec>;
