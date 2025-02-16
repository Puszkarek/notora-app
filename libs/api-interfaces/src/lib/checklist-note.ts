import * as t from 'io-ts';

import { baseNoteCodec } from '@api-interfaces/base-note';
import { checklistItemCodec } from '@api-interfaces/checklist-item';

export const checklistNoteCodec = t.readonly(
  t.intersection([
    baseNoteCodec,
    t.type({
      type: t.literal('checklist'),
      items: t.readonlyArray(checklistItemCodec),
    }),
  ]),
);

export type CheckListNote = t.TypeOf<typeof checklistNoteCodec>;
