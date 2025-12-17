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

export const providerTypeSchema = z.nativeEnum(IdentityProvider);

export type ProviderTypeSchema = z.infer<typeof providerTypeSchema>;

export const PROVIDER_REQUIRED_SCOPES: Record<ProviderTypeSchema, string[]> = {
  EMAIL: [],
  YOUTUBE: [],
  INSTAGRAM: [],
  ANONYMOUS: [],
  BLUESKY: REQUIRED_BLUESKY_SCOPES,
  // for some reason facebook does not return scopes on sign in or link account
  FACEBOOK: [],
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

export const isProviderType = (value: unknown): value is ProviderTypeSchema => {
  return providerTypeSchema.safeParse(value).success;
};

export const providerSchema = z.object({
  type: providerTypeSchema,
  scopes: z.array(z.string()),
  label: z.string(),
  link: z.string().nullish()
});

export type ProviderSchema = z.infer<typeof providerSchema>;

export const IDENTITY_PROVIDER_LABEL: Record<ProviderTypeSchema, string> = {
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

export const IS_SOCIAL_PROVIDER: Record<ProviderTypeSchema, boolean> = {
  ANONYMOUS: false,
  TWITTER: true,
  BLUESKY: true,
  GOOGLE: true,
  DISCORD: true,
  STEAM: true,
  TWITCH: true,
  KICK: true,
  FACEBOOK: true,
  INSTAGRAM: false,
  YOUTUBE: false,
  EMAIL: false,
  TIKTOK: true
};

export const ENABLED_IDENTITY_PROVIDERS: Record<ProviderTypeSchema, boolean> = {
  TWITTER: true,
  BLUESKY: true,
  GOOGLE: true,
  DISCORD: true,
  STEAM: true,
  TWITCH: true,
  KICK: true,
  TIKTOK: true,
  FACEBOOK: false,
  INSTAGRAM: false,
  YOUTUBE: false,
  ANONYMOUS: true,
  EMAIL: true
};

const AVAILABLE_LOGIN_PROVIDERS: Record<ProviderTypeSchema, boolean> = {
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
  .map(([providerId]) => providerId) as ProviderTypeSchema[];

export const isIdentityProvider = (
  value: unknown
): value is IdentityProvider => {
  return providerTypeSchema.safeParse(value).success;
};

// Mapping from IdentityProvider to next-auth provider strings found in lib/auth/config.ts
export const IDENTITY_PROVIDER_TO_AUTH_PROVIDER: Record<
  IdentityProvider,
  string
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
  allowedIdentities: ProviderTypeSchema[]
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
