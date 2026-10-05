import { UserAccountType } from '@giveaway/db-model';
import z from 'zod';

export const accountTypeSchema = z.nativeEnum(UserAccountType);

export type AccountTypeSchema = z.infer<typeof accountTypeSchema>;

export const completeOnboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username must be at most 15 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  accountType: accountTypeSchema,
  image: z.string().url().nullable().optional()
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

export const updateAccountTypeSchema = z.object({
  accountType: accountTypeSchema
});

export type UpdateAccountTypeInput = z.infer<typeof updateAccountTypeSchema>;

export const ACCOUNT_TYPE_OPTIONS = {
  [UserAccountType.PARTICIPANT]: {
    title: 'Participate in Giveaways',
    description:
      'Browse and enter giveaways from your favorite creators and brands.',
    emoji: '🎉'
  },
  [UserAccountType.HOST]: {
    title: 'Host Giveaways',
    description:
      'Create and manage giveaways for your community, brand, or organization.',
    emoji: '🎁'
  }
} as const;
