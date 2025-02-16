import { idCodec } from '@api-interfaces/common';
import * as t from 'io-ts';
import { date } from 'io-ts-types';

export const checklistItemCodec = t.readonly(
  t.type({
    id: idCodec,
    label: t.string,
    createdBy: idCodec,
    createdAt: date,

    completedAt: t.union([date, t.null]),
  }),
);

export type ChecklistItem = t.TypeOf<typeof checklistItemCodec>;
