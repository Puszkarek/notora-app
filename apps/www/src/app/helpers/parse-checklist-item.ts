import { ChecklistItem } from '@api-interfaces';

export const parseChecklistItem = (data: ChecklistItem): ChecklistItem => {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
  };
};
