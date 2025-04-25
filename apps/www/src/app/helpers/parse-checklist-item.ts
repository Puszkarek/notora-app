import { ChecklistItem } from '@api-interfaces';
import { ChecklistItemEntity } from '@www/app/interfaces/checklist-item';

export const parseChecklistItem = (noteID: string, data: ChecklistItem): ChecklistItemEntity => {
  return {
    ...data,
    noteID,
    createdAt: new Date(data.createdAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
  };
};
