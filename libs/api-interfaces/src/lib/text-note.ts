import * as t from 'io-ts';

import { baseNoteCodec } from '@api-interfaces/base-note';

export const textNoteCodec = t.readonly(
  t.intersection([
    baseNoteCodec,
    t.type({
      type: t.literal('text'),
      content: t.string,
    }),
  ]),
);

export type TextNote = t.TypeOf<typeof textNoteCodec>;
