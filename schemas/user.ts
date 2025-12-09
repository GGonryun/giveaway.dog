import { Prisma, UserSource } from '@prisma/client';
import z from 'zod';
import {
  userFeatureFlagKeySchema,
  parseUserFeatureFlags
} from './feature-flags';
import { UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';

import { clamp } from 'lodash';

import {
  providerSchema,
  ProviderSchema,
  ProviderTypeSchema,
  providerTypeSchema
} from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@/lib/errors';
import { Nil } from '@/lib/types';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().nullable(),
  emoji: z.string().nullable(),
  countryCode: z.string().nullable(),
  qualityScore: z.number(),
  providers: providerSchema.array(),
  source: z.nativeEnum(UserSource)
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const userSchema = userProfileSchema.extend({
  emailVerified: z.boolean().nullable(),
  featureFlags: userFeatureFlagKeySchema.array().optional(),
  isAnonymous: z.boolean()
});

export type UserSchema = z.infer<typeof userSchema>;

export const parseProviders = (providers: UserAccounts[]): ProviderSchema[] =>
  providers.map((provider) => ({
    type: parseProvider(provider.provider) || 'email',
    scopes: splitScopes(provider.scope),
    label: provider.label || 'N/A',
    link: provider.link || ''
  }));

const splitScopes = (scopes: Nil<string>): string[] =>
  scopes
    ?.split(/[\s,]+/) // split by space OR comma
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

export const parseProvider = (provider: Nil<string>): ProviderTypeSchema => {
  const result = providerTypeSchema.safeParse(provider);
  if (result.success) {
    return result.data;
  }

  throw new ApplicationError({
    code: 'VALIDATION_ERROR',
    message: `Unsupported provider ${provider || 'unknown'}`
  });
};

export const createUserProfileSchema = z.object({
  name: z.string()
});

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(5, 'Username must be at least 5 characters')
    .regex(
      /^[a-zA-Z0-9_\- ]+$/,
      'Username can only contain letters, numbers, spaces, hyphens, and underscores'
    )
    .optional()
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const ageVerificationSchema = z.object({
  userId: z.string(),
  sweepstakesId: z.string()
});

export type AgeVerificationSchema = z.infer<typeof ageVerificationSchema>;

const ACCOUNT_SELECT_QUERY = {
  provider: true,
  scope: true,
  label: true,
  link: true
} satisfies Prisma.AccountSelect;

export type UserAccounts = Prisma.AccountGetPayload<{
  select: typeof ACCOUNT_SELECT_QUERY;
}>;

export const USER_SCHEMA_SELECT_QUERY = {
  id: true,
  email: true,
  name: true,
  emoji: true,
  source: true,
  ips: {
    include: {
      ip: true
    },
    take: 1,
    orderBy: {
      // Get the latest IP
      updatedAt: 'desc'
    }
  },
  quality: {
    take: 1,
    orderBy: {
      // Get the latest quality score
      updatedAt: 'desc'
    }
  },
  emailVerified: true,
  accounts: {
    select: ACCOUNT_SELECT_QUERY
  },
  featureFlags: true
} satisfies Prisma.UserSelect;

export const toUserSchema = (
  user: Prisma.UserGetPayload<{ select: typeof USER_SCHEMA_SELECT_QUERY }>
): UserSchema => ({
  id: user.id,
  email: user.email,
  name: user.name,
  emoji: user.emoji,
  source: user.source,
  countryCode: user.ips[0]?.ip.countryCode || UNKNOWN_USER_COUNTRY_CODE,
  qualityScore: clamp(user.quality[0]?.score ?? 0, 0, 100),
  emailVerified: !!user.emailVerified,
  providers: parseProviders(user.accounts),
  featureFlags: parseUserFeatureFlags(user.featureFlags),
  isAnonymous: user.accounts.length === 0
});

export const userDetailsTabSchema = z.union([
  z.literal('overview'),
  z.literal('entries'),
  z.literal('devices'),
  z.literal('risk')
]);

export type UserDetailsTabSchema = z.infer<typeof userDetailsTabSchema>;

export const USER_DETAILS_TAB_OPTIONS: Record<UserDetailsTabSchema, string> = {
  overview: 'Overview',
  devices: 'Devices',
  risk: 'Risk',
  entries: 'Entries'
};

export const isUserDetailsTab = (tab: string): tab is UserDetailsTabSchema => {
  return userDetailsTabSchema.safeParse(tab).success;
};

export const isAnonymousUser = (user: Nil<UserSchema>): boolean => {
  if (user?.providers.length === 0) return true;
  return user?.providers.some((p) => p.type === 'anonymous') ?? false;
};
