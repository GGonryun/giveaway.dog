import { TaskOf, TaskType } from '../../../schemas';

export const toDefaultValues = <T extends TaskType>(type: T): TaskOf<T> => {
  const defaults: { [key in TaskType]: TaskOf<key> } = {
    'bonus-task': {
      type: 'bonus-task',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    'visit-url': {
      type: 'visit-url',
      title: 'Visit our website',
      href: 'https://example.com',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
