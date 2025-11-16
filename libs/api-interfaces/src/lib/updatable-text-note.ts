import * as t from 'io-ts';

export const updatableTextNoteCodec = t.readonly(
  t.partial({
    content: t.string,
  }),
);

export type UpdatableTextNote = t.TypeOf<typeof updatableTextNoteCodec>;
