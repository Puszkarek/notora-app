import * as t from 'io-ts';

import { baseNoteCodec } from '@api-interfaces/base-note';

export const checklistNoteCodec = t.readonly(
  t.intersection([
    baseNoteCodec,
    t.type({
      type: t.literal('checklist'),
    }),
  ]),
);

export type CheckListNote = t.TypeOf<typeof checklistNoteCodec>;
