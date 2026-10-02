import { BonusLoyaltyTaskSchema } from '../task/schemas';

export const isLoyal = (loyalty: number, task: BonusLoyaltyTaskSchema) =>
  loyalty >= task.loyaltyRequired;
