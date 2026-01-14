import { Nil } from '@/lib/types';
import z from 'zod';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_TIKTOK_SCOPES,
  REQUIRED_BLUESKY_SCOPES
} from '../scopes';
import { widetype } from '@/lib/widetype';
import { IdentityProvider } from '@prisma/client';
import { ApplicationError } from '@/lib/errors';

export const identityProviderSchema = z.nativeEnum(IdentityProvider);

export type IdentityProviderSchema = z.infer<typeof identityProviderSchema>;

export const PROVIDER_REQUIRED_SCOPES: Record<IdentityProvider, string[]> = {
  EMAIL: [],
  YOUTUBE: [],
  INSTAGRAM: [],
  ANONYMOUS: [],
  FACEBOOK: [],
  BLUESKY: REQUIRED_BLUESKY_SCOPES,
  DISCORD: REQUIRED_DISCORD_SCOPES,
  TWITTER: REQUIRED_TWITTER_SCOPES,
  STEAM: REQUIRED_STEAM_SCOPES,
  GOOGLE: REQUIRED_GMAIL_SCOPES,
  TWITCH: REQUIRED_TWITCH_SCOPES,
  KICK: REQUIRED_KICK_SCOPES,
  TIKTOK: REQUIRED_TIKTOK_SCOPES
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

export const isProviderType = (
  value: unknown
): value is IdentityProviderSchema => {
  return identityProviderSchema.safeParse(value).success;
};

export const providerSchema = z.object({
  type: identityProviderSchema,
  scopes: z.array(z.string()),
  label: z.string(),
  link: z.string().nullish(),
  status: z.enum(['ACTIVE', 'ERROR']).default('ACTIVE')
});

export type ProviderSchema = z.infer<typeof providerSchema>;

export const IDENTITY_PROVIDER_LABEL: Record<IdentityProviderSchema, string> = {
  TWITTER: 'X (Twitter)',
  BLUESKY: 'Bluesky',
  ANONYMOUS: 'Anonymous',
  GOOGLE: 'Google',
  DISCORD: 'Discord',
  YOUTUBE: 'YouTube',
  EMAIL: 'Email',
  TWITCH: 'Twitch',
  STEAM: 'Steam',
  KICK: 'Kick',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok'
};

export const IS_SOCIAL_PROVIDER: Record<IdentityProviderSchema, boolean> = {
  ANONYMOUS: false,
  TWITTER: true,
  BLUESKY: true,
  GOOGLE: true,
  DISCORD: true,
  STEAM: true,
  TWITCH: true,
  KICK: true,
  TIKTOK: true,
  FACEBOOK: true,
  INSTAGRAM: true,
  YOUTUBE: false,
  EMAIL: false
};

export const ENABLED_IDENTITY_PROVIDERS: Record<
  IdentityProviderSchema,
  boolean
> = {
  TWITTER: true,
  BLUESKY: true,
  GOOGLE: true,
  DISCORD: true,
  STEAM: true,
  TWITCH: true,
  KICK: true,
  TIKTOK: true,
  INSTAGRAM: true,
  FACEBOOK: true,
  ANONYMOUS: true,
  YOUTUBE: false,
  EMAIL: true
};

const AVAILABLE_LOGIN_PROVIDERS: Record<IdentityProviderSchema, boolean> = {
  TWITTER: true,
  GOOGLE: true,
  BLUESKY: true,
  DISCORD: true,
  STEAM: true,
  TWITCH: true,
  KICK: true,
  TIKTOK: true,
  FACEBOOK: false,
  INSTAGRAM: false,
  YOUTUBE: false,
  EMAIL: true,
  ANONYMOUS: false
};
export const LOGIN_PROVIDERS = widetype
  .entries(AVAILABLE_LOGIN_PROVIDERS)
  .filter(([, isEnabled]) => isEnabled)
  .map(([providerId]) => providerId);

export const SOCIAL_PROVIDERS = Object.entries(IS_SOCIAL_PROVIDER)
  .filter(([, isSocial]) => isSocial)
  .map(([providerId]) => providerId) as IdentityProviderSchema[];

export const isIdentityProvider = (
  value: unknown
): value is IdentityProvider => {
  return identityProviderSchema.safeParse(value).success;
};

// Mapping from IdentityProvider to next-auth provider strings found in lib/auth/config.ts
export const authProviderSchema = z.union([
  z.literal('twitter'),
  z.literal('bluesky'),
  z.literal('google'),
  z.literal('discord'),
  z.literal('steam'),
  z.literal('twitch'),
  z.literal('kick'),
  z.literal('tiktok'),
  z.literal('facebook'),
  z.literal('instagram'),
  z.literal('youtube'),
  z.literal('email'),
  z.literal('anonymous')
]);

export type AuthProvider = z.infer<typeof authProviderSchema>;

export const parseAuthProvider = (value: unknown): AuthProvider => {
  const result = authProviderSchema.safeParse(value);
  if (!result.success)
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: `Invalid auth provider: ${value}`,
      cause: result.error
    });
  return result.data;
};

export const IDENTITY_PROVIDER_TO_AUTH_PROVIDER: Record<
  IdentityProvider,
  AuthProvider
> = {
  TWITTER: 'twitter',
  BLUESKY: 'bluesky',
  GOOGLE: 'google',
  DISCORD: 'discord',
  STEAM: 'steam',
  TWITCH: 'twitch',
  KICK: 'kick',
  TIKTOK: 'tiktok',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  EMAIL: 'email',
  ANONYMOUS: 'anonymous'
};
export const AUTH_PROVIDER_TO_IDENTITY_PROVIDER: Record<
  string,
  IdentityProvider
> = widetype.entries(IDENTITY_PROVIDER_TO_AUTH_PROVIDER).reduce(
  (acc, [identityProvider, authProvider]) => {
    acc[authProvider] = identityProvider as IdentityProvider;
    return acc;
  },
  {} as Record<string, IdentityProvider>
);

export const doesUserHaveAllowedIdentity = (
  user: Nil<{ providers: ProviderSchema[] }>,
  allowedIdentities: IdentityProviderSchema[]
) => {
  if (!user || !user.providers) {
    return false;
  }

  if (allowedIdentities.includes('ANONYMOUS') && user) {
    return true;
  }

  return user.providers.some((provider) =>
    allowedIdentities.includes(provider.type)
  );
};
