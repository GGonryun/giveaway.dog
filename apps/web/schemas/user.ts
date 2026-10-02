import {
  IdentityProvider,
  Prisma,
  UserSource,
  UserAccountType
} from '@prisma/client';
import z from 'zod';
import { UNKNOWN_USER_AGENT, UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';

import { clamp } from 'lodash';

import {
  AUTH_PROVIDER_TO_IDENTITY_PROVIDER,
  providerSchema,
  ProviderSchema,
  IdentityProviderSchema,
  identityProviderSchema
} from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@giveaway/util-errors';
import { Nil } from '@giveaway/util-types/types';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().nullable(),
  image: z
    .string()
    .nullable()
    .transform((v) => {
      if (!v) return null;
      try {
        new URL(v);
        return v;
      } catch {
        return null;
      }
    }),
  countryCode: z.string().nullable(),
  userAgent: z.string().nullable(),
  birthday: z.coerce.date().nullable(),
  qualityScore: z.number(),
  providers: providerSchema.array(),
  source: z.nativeEnum(UserSource),
  username: z.string().nullable().optional(),
  onboarded: z.boolean().optional(),
  accountType: z.nativeEnum(UserAccountType).optional(),
  preferredContactMethod: identityProviderSchema.nullable()
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const userSchema = userProfileSchema.extend({
  emailVerified: z.boolean().nullable(),
  createdAt: z.coerce.date(),
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
    link: provider.link || '',
    status: provider.status
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
  image: z.string().url().nullable().optional(),
  preferredContactMethod: identityProviderSchema.nullable().optional()
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
  link: true,
  status: true
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
  onboarded: true,
  accountType: true,
  username: true,
  preferredContactMethod: true
} satisfies Prisma.UserSelect;

const sanitizeUrl = (value: Nil<string>): string | null => {
  if (!value) return null;
  try {
    new URL(value);
    return value;
  } catch {
    return null;
  }
};

export const toUserSchema = (
  user: Prisma.UserGetPayload<{ select: typeof USER_SCHEMA_SELECT_QUERY }>
): UserSchema => ({
  id: user.id,
  email: user.email,
  name: user.name,
  image: sanitizeUrl(user.image),
  source: user.source,
  birthday: user.birthday,
  createdAt: user.createdAt,
  countryCode: user.ips[0]?.ip.countryCode || UNKNOWN_USER_COUNTRY_CODE,
  userAgent: user.agents[0]?.agent.id ?? UNKNOWN_USER_AGENT,
  qualityScore: clamp(user.quality[0]?.score ?? 0, 0, 100),
  emailVerified: !!user.emailVerified,
  providers: parseProviders(user.accounts),
  onboarded: user.onboarded,
  accountType: user.accountType,
  username: user.username,
  preferredContactMethod: user.preferredContactMethod ?? null,
  isAnonymous: user.accounts.length === 0
});

export const userDetailsTabSchema = z.union([
  z.literal('overview'),
  z.literal('entries')
]);

export type UserDetailsTabSchema = z.infer<typeof userDetailsTabSchema>;

export const DEFAULT_USER_DETAILS_TAB: UserDetailsTabSchema = 'overview';

export const USER_DETAILS_TAB_OPTIONS: Record<UserDetailsTabSchema, string> = {
  overview: 'Overview',
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
