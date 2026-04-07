import { assertNever } from '@/lib/errors';
import { Prisma } from '@prisma/client';
import { clamp } from 'lodash';
import z from 'zod';

export const USER_BASE_SCORE = 30;
export const MAX_SCORING_REQUESTS_PER_RUN = 15;
export const MAX_TRACKING_REQUESTS_PER_RUN = 10;
export const COMPLETION_THRESHOLD_DAYS = 30;
export const IP_ADDRESS_THRESHOLD_DAYS = 30;
export const MAX_DEVICE_STABILITY_BONUS = 20;
export const PER_DEVICE_STABILITY_BONUS = 2;
export const DEVICE_STABILITY_BONUS_STEP = 10;
export const MAX_IP_CONSISTENCY_BONUS = 20;
export const PER_ADDITIONAL_IP_PENALTY = 5;
export const MAX_GEO_CONSISTENCY_BONUS = 10;
export const GEO_COUNTRY_BONUS = 5;
export const GEO_CONTINENT_BONUS = 2;
export const MAX_PROVIDERS_CONNECTED_BONUS = 10;
export const PER_PROVIDER_BONUS = 2;
export const MAX_EMAIL_VERIFIED_BONUS = 10;
export const MAX_TASK_ACTIVITY_BONUS = 10;
export const PER_TASK_BONUS = 3;
export const MAX_TASK_DIVERSITY_BONUS = 10;
export const MAX_ACCOUNT_AGE_BONUS = 10;
export const MAX_IP_CONSISTENCY_PUNISHMENT = -30;
export const MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT = -30;
export const MAX_TURNSTILE_TRUST_BONUS = 10;
export const MIN_TURNSTILE_TRUST_PENALTY = -10;

export const signupUserQualitySchema = z.object({
  type: z.literal('SIGNUP'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const importedUserQualitySchema = z.object({
  type: z.literal('IMPORTED'),
  id: z.string(),
  userId: z.string(),
  score: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const userQualitySchema = z.discriminatedUnion('type', [
  signupUserQualitySchema,
  importedUserQualitySchema
]);

export type UserQualitySchema = z.infer<typeof userQualitySchema>;
export type SignupUserQualitySchema = z.infer<typeof signupUserQualitySchema>;
export type ImportedUserQualitySchema = z.infer<
  typeof importedUserQualitySchema
>;

export const toUserQuality = (
  data: Prisma.UserQualityGetPayload<{
    include: { user: { select: { source: true } } };
  }>
): UserQualitySchema => {
  const base = {
    id: data.id,
    userId: data.userId,
    score: clamp(data.score, 0, 100),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };

  const userSource = data.user.source;

  switch (userSource) {
    case 'SIGNUP':
    case 'ANONYMOUS':
    case 'MANUAL_IMPORT':
      return { ...base, type: 'SIGNUP' as const };
    case 'TWITTER_IMPORT':
    case 'BLUESKY_IMPORT':
    case 'DISCORD_IMPORT':
    case 'TWITCH_IMPORT':
      return { ...base, type: 'IMPORTED' as const };
    default:
      throw assertNever(userSource);
  }
};
