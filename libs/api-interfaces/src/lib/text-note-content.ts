import * as t from 'io-ts';

export const textNoteContentCodec = t.readonly(
  t.type({
    content: t.string,
  }),
);

export type TextNoteContent = t.TypeOf<typeof textNoteContentCodec>;
