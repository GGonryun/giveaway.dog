import { SweepstakesFormFieldType } from '@prisma/client';
import { AgeSweepstakesFormFieldSchema } from './schemas';

export const DEFAULT_MINIMUM_AGE = 16;

export const toMinimumAgeLabel = (age: number) => {
  return `I am at least ${age} years of age (required)`;
};

export const DEFAULT_MINIMUM_AGE_FIELD: Omit<
  AgeSweepstakesFormFieldSchema,
  'id'
> = {
  minimum: DEFAULT_MINIMUM_AGE,
  type: SweepstakesFormFieldType.AGE,
  label: toMinimumAgeLabel(DEFAULT_MINIMUM_AGE),
  required: true
};
