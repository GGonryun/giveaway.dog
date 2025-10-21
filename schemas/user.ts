import { Prisma } from '@prisma/client';
import z from 'zod';
import {
  userFeatureFlagKeySchema,
  parseUserFeatureFlags
} from './feature-flags';
import { UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES
} from '@/lib/auth/scopes';
import { Nil } from '@/lib/types';

export const providerTypeSchema = z.union([
  z.literal('twitter'),
  z.literal('google'),
  z.literal('discord'),
  z.literal('email'),
  z.literal('steam')
]);

export type ProviderTypeSchema = z.infer<typeof providerTypeSchema>;

export const PROVIDER_REQUIRED_SCOPES: Record<ProviderTypeSchema, string[]> = {
  email: [],
  discord: REQUIRED_DISCORD_SCOPES,
  twitter: REQUIRED_TWITTER_SCOPES,
  steam: REQUIRED_STEAM_SCOPES,
  google: REQUIRED_GMAIL_SCOPES
};

export const isMissingScopes = (
  provider: Nil<ProviderSchema>,
  requiredScopes: string[]
) => {
  return (
    requiredScopes &&
    requiredScopes.length > 0 &&
    !requiredScopes.every((scope) => provider?.scopes.includes(scope))
  );
};

export const isProviderType = (value: unknown): value is ProviderTypeSchema => {
  return providerTypeSchema.safeParse(value).success;
};

export const providerSchema = z.object({
  type: providerTypeSchema,
  scopes: z.array(z.string()),
  label: z.string()
});

export const includesProvider = (
  providers: ProviderSchema[] | undefined,
  providerId: string | ProviderTypeSchema | undefined
) => {
  if (!providers || !providerId) return false;
  if (!isProviderType(providerId)) return false;
  return providers.some((p) => p.type === providerId);
};

export type ProviderSchema = z.infer<typeof providerSchema>;

export const PROVIDER_SCHEMA_LABELS: Record<ProviderTypeSchema, string> = {
  twitter: 'X (Twitter)',
  google: 'Google',
  discord: 'Discord',
  email: 'Email',
  steam: 'Steam'
};

export const IS_SOCIAL_PROVIDER: Record<ProviderTypeSchema, boolean> = {
  twitter: true,
  google: true,
  discord: true,
  steam: true,
  email: false
};

export const SOCIAL_PROVIDERS = Object.entries(IS_SOCIAL_PROVIDER)
  .filter(([, isSocial]) => isSocial)
  .map(([providerId]) => providerId) as ProviderTypeSchema[];

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().nullable(),
  emoji: z.string().nullable(),
  countryCode: z.string().nullable(),
  qualityScore: z.number(),
  providers: providerSchema.array()
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const userSchema = userProfileSchema.extend({
  emailVerified: z.boolean().nullable(),
  featureFlags: userFeatureFlagKeySchema.array().optional()
});

export type UserSchema = z.infer<typeof userSchema>;

export const parseProviders = (providers: UserAccounts[]): ProviderSchema[] =>
  providers.map((provider) => ({
    type: parseProvider(provider.provider) || 'email',
    scopes: provider.scope?.split(' ') ?? [],
    label: provider.label || 'N/A'
  }));

export const parseProvider = (provider: unknown) => {
  if (typeof provider !== 'string') {
    return null;
  }

  const result = providerTypeSchema.safeParse(provider);
  if (result.success) {
    return result.data;
  }

  return null;
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
  label: true
} satisfies Prisma.AccountSelect;

export type UserAccounts = Prisma.AccountGetPayload<{
  select: typeof ACCOUNT_SELECT_QUERY;
}>;

export const USER_SCHEMA_SELECT_QUERY = {
  id: true,
  email: true,
  name: true,
  emoji: true,
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
  countryCode: user.ips[0]?.ip.countryCode || UNKNOWN_USER_COUNTRY_CODE,
  qualityScore: user.quality[0]?.score ?? 0,
  emailVerified: !!user.emailVerified,
  providers: parseProviders(user.accounts),
  featureFlags: parseUserFeatureFlags(user.featureFlags)
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
