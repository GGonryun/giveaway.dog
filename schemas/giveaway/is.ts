import { RequiredFields } from '@/lib/types';
import { SweepstakesInputPrizeSchema, SweepstakesInputTaskSchema } from './db';

export const isStorablePrize = (
  prize: SweepstakesInputPrizeSchema
): prize is RequiredFields<typeof prize, 'id'> => {
  return Boolean(prize?.id);
};

export const isStorableTask = (
  task: SweepstakesInputTaskSchema
): task is RequiredFields<SweepstakesInputTaskSchema, 'id'> => {
  return Boolean(task?.id);
};
