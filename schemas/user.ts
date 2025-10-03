import { UNKNOWN_USER_AGENT, UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';
import { Prisma, UserType } from '@prisma/client';
import z from 'zod';

export const providerSchema = z.union([
  z.literal('twitter'),
  z.literal('google'),
  z.literal('discord'),
  z.literal('email')
]);

export type ProviderSchemaType = z.infer<typeof providerSchema>;

export const PROVIDER_SCHEMA_LABELS: Record<ProviderSchemaType, string> = {
  twitter: 'X (Twitter)',
  google: 'Google',
  discord: 'Discord',
  email: 'Email'
};

export const IS_SOCIAL_PROVIDER: Record<ProviderSchemaType, boolean> = {
  twitter: true,
  google: true,
  discord: true,
  email: false
};

export const SOCIAL_PROVIDERS: ProviderSchemaType[] = [
  'twitter',
  'google',
  'discord'
];

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  emailVerified: z.boolean().nullable(),
  emoji: z.string().nullable(),
  countryCode: z.string().nullable(),
  providers: providerSchema.array()
});

export type UserProfileSchema = z.infer<typeof userProfileSchema>;

export const userSchema = userProfileSchema.extend({
  emailVerified: z.boolean().nullable(),
  type: z.nativeEnum(UserType).array()
});

export type UserSchema = z.infer<typeof userSchema>;

export const parseProviders = (providers: unknown) => {
  if (!Array.isArray(providers)) {
    return [];
  }
  if (providers.length === 0) {
    return [];
  }

  if (providers.some((provider) => typeof provider !== 'string')) {
    return [];
  }

  return providers.filter((provider) => {
    return providerSchema.safeParse(provider).success;
  });
};

export const parseProvider = (provider: unknown) => {
  if (typeof provider !== 'string') {
    return null;
  }

  const result = providerSchema.safeParse(provider);
  if (result.success) {
    return result.data;
  }

  return null;
};

export const updateUserProfileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.array(z.nativeEnum(UserType)).optional()
});

export const ageVerificationSchema = z.object({
  userId: z.string(),
  sweepstakesId: z.string()
});

export type AgeVerificationSchema = z.infer<typeof ageVerificationSchema>;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const USER_SCHEMA_SELECT_QUERY = {
  id: true,
  email: true,
  name: true,
  emoji: true,
  countryCode: true,
  emailVerified: true,
  type: true,
  accounts: {
    select: { provider: true }
  }
} satisfies Prisma.UserSelect;

export const toUserSchema = (
  user: Prisma.UserGetPayload<{ select: typeof USER_SCHEMA_SELECT_QUERY }>
): UserSchema => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emoji: user.emoji,
    countryCode: user.countryCode,
    emailVerified: !!user.emailVerified,
    type: user.type,
    providers: parseProviders(user.accounts.map((account) => account.provider))
  };
};
