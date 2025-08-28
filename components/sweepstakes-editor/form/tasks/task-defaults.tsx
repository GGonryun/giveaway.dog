import { TaskOf } from '@/schemas/giveaway';
import { TaskType } from '@prisma/client';

export const toDefaultValues = <T extends TaskType>(type: T): TaskOf<T> => {
  const defaults: { [key in TaskType]: TaskOf<key> } = {
    [TaskType.BONUS_TASK]: {
      id: '',
      type: TaskType.BONUS_TASK,
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    [TaskType.VISIT_URL]: {
      id: '',
      type: TaskType.VISIT_URL,
      title: 'Visit our website',
      href: 'https://example.com',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
