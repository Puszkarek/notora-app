import { CheckListNote } from '@api-interfaces';
import { parseChecklistItem } from '@www/app/helpers/parse-checklist-item';

export const parseChecklistNote = (data: CheckListNote): CheckListNote => {
  return {
    ...data,
    items: data.items.map(parseChecklistItem),
  };
};
