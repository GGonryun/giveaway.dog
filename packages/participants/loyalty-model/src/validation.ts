import { BonusLoyaltyTaskSchema } from '@giveaway/task-model/schemas';

export const isLoyal = (loyalty: number, task: BonusLoyaltyTaskSchema) =>
  loyalty >= task.loyaltyRequired;
