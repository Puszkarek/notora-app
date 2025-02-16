import { idCodec } from '@api-interfaces/common';
import * as t from 'io-ts';

export const checklistItemCodec = t.readonly(
  t.type({
    label: t.string,
    createdBy: idCodec,
    createdAt: t.string,

    completedAt: t.union([t.string, t.null]),
  }),
);

export type ChecklistItem = t.TypeOf<typeof checklistItemCodec>;
