import { z } from 'zod';

export const referredUserSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string()
  }),
  createdAt: z.coerce.date()
});

export type ReferredUserSchema = z.infer<typeof referredUserSchema>;

export const userReferralSchema = z.object({
  id: z.string(),
  code: z.string(),
  link: z.string(),
  referrals: referredUserSchema.array()
});

export type UserReferralSchema = z.infer<typeof userReferralSchema>;

export const DEFAULT_USER_REFERRAL: UserReferralSchema = {
  id: '',
  code: '',
  link: '',
  referrals: []
};

export const createReferralSchema = z.object({
  taskId: z.string(),
  sweepstakesId: z.string()
});
export type CreateReferralSchema = z.infer<typeof createReferralSchema>;
