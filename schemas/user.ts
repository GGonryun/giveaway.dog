import { IdentityProvider, Prisma, UserSource } from '@prisma/client';
import z from 'zod';
import {
  userFeatureFlagKeySchema,
  parseUserFeatureFlags
} from './feature-flags';
import { UNKNOWN_USER_AGENT, UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';

import { clamp } from 'lodash';

import {
  AUTH_PROVIDER_TO_IDENTITY_PROVIDER,
  providerSchema,
  ProviderSchema,
  IdentityProviderSchema,
  identityProviderSchema
} from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@/lib/errors';
import { Nil } from '@/lib/types';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().nullable(),
  image: z.string().url().nullable(),
  countryCode: z.string().nullable(),
  userAgent: z.string().nullable(),
  birthday: z.coerce.date().nullable(),
  qualityScore: z.number(),
  providers: providerSchema.array(),
  source: z.nativeEnum(UserSource)
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const userSchema = userProfileSchema.extend({
  emailVerified: z.boolean().nullable(),
  createdAt: z.coerce.date(),
  featureFlags: userFeatureFlagKeySchema.array().optional(),
  isAnonymous: z.boolean()
});

export type UserSchema = z.infer<typeof userSchema>;

export const engagedUserSchema = userSchema.extend({
  engagement: z.number()
});

export type EngagedUserSchema = z.infer<typeof engagedUserSchema>;

export const parseProviders = (providers: UserAccounts[]): ProviderSchema[] =>
  providers.map((provider) => ({
    type:
      parseProvider(AUTH_PROVIDER_TO_IDENTITY_PROVIDER[provider.provider]) ||
      'EMAIL',
    scopes: splitScopes(provider.scope),
    label: provider.label || 'N/A',
    link: provider.link || ''
  }));

const splitScopes = (scopes: Nil<string>): string[] =>
  scopes
    ?.split(/[\s,]+/) // split by space OR comma
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

export const parseProvider = (
  provider: Nil<string>
): IdentityProviderSchema => {
  const result = identityProviderSchema.safeParse(provider);
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
    .optional(),
  image: z.string().url().nullable().optional()
});

export const blueskyHandleSchema = z
  .string()
  .min(1, 'Bluesky handle is required')
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)'
  );

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

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
  image: true,
  source: true,
  createdAt: true,
  birthday: true,
  agents: {
    include: {
      agent: true
    },
    take: 1,
    orderBy: {
      // Get the latest user agent
      updatedAt: 'desc'
    }
  },
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
  image: user.image,
  source: user.source,
  birthday: user.birthday,
  createdAt: user.createdAt,
  countryCode: user.ips[0]?.ip.countryCode || UNKNOWN_USER_COUNTRY_CODE,
  userAgent: user.agents[0]?.agent.id ?? UNKNOWN_USER_AGENT,
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
  return (
    user?.providers.some((p) => p.type === IdentityProvider.ANONYMOUS) ?? false
  );
};
