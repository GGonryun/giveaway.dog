import { TaskOf } from '@/schemas/giveaway/schemas';
import { TaskType } from '@prisma/client';

export const toDefaultValues = <T extends TaskType>(type: T): TaskOf<T> => {
  const defaults: { [key in TaskType]: TaskOf<key> } = {
    ['BONUS_TASK']: {
      id: '',
      type: 'BONUS_TASK',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['VISIT_URL']: {
      id: '',
      type: 'VISIT_URL',
      title: 'Visit our website',
      href: 'https://example.com',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
