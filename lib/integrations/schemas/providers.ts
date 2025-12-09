import { Nil } from '@/lib/types';
import z from 'zod';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_TIKTOK_SCOPES
} from '../scopes';
import { widetype } from '@/lib/widetype';

export const providerTypeSchema = z.union([
  z.literal('twitter'),
  z.literal('google'),
  z.literal('youtube'),
  z.literal('discord'),
  z.literal('email'),
  z.literal('steam'),
  z.literal('twitch'),
  z.literal('kick'),
  z.literal('instagram'),
  z.literal('facebook'),
  z.literal('tiktok'),
  z.literal('anonymous')
]);

export type ProviderTypeSchema = z.infer<typeof providerTypeSchema>;

export const PROVIDER_REQUIRED_SCOPES: Record<ProviderTypeSchema, string[]> = {
  email: [],
  youtube: [],
  instagram: [],
  anonymous: [],
  // for some reason facebook does not return scopes on sign in or link account
  facebook: [],
  discord: REQUIRED_DISCORD_SCOPES,
  twitter: REQUIRED_TWITTER_SCOPES,
  steam: REQUIRED_STEAM_SCOPES,
  google: REQUIRED_GMAIL_SCOPES,
  twitch: REQUIRED_TWITCH_SCOPES,
  kick: REQUIRED_KICK_SCOPES,
  tiktok: REQUIRED_TIKTOK_SCOPES
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

export const PROVIDER_SCHEMA_LABELS: Record<ProviderTypeSchema, string> = {
  twitter: 'X (Twitter)',
  anonymous: 'Anonymous',
  google: 'Google',
  discord: 'Discord',
  youtube: 'YouTube',
  email: 'Email',
  twitch: 'Twitch',
  steam: 'Steam',
  kick: 'Kick',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok'
};

export const IS_SOCIAL_PROVIDER: Record<ProviderTypeSchema, boolean> = {
  anonymous: false,
  twitter: true,
  google: true,
  discord: true,
  steam: true,
  twitch: true,
  kick: true,
  facebook: true,
  instagram: false,
  youtube: false,
  email: false,
  tiktok: true
};

export const ENABLED_AUTH_PROVIDERS: Record<ProviderTypeSchema, boolean> = {
  twitter: true,
  google: true,
  discord: true,
  steam: true,
  twitch: true,
  kick: true,
  tiktok: true,
  facebook: false,
  instagram: false,
  youtube: false,
  anonymous: true,
  email: true
};

const AVAILABLE_LOGIN_PROVIDERS: Record<ProviderTypeSchema, boolean> = {
  twitter: true,
  google: true,
  discord: true,
  steam: false,
  twitch: false,
  kick: false,
  tiktok: true,
  facebook: false,
  instagram: false,
  youtube: false,
  anonymous: false,
  email: true
};
export const LOGIN_PROVIDERS = widetype
  .entries(AVAILABLE_LOGIN_PROVIDERS)
  .filter(([, isEnabled]) => isEnabled)
  .map(([providerId]) => providerId);

export const SOCIAL_PROVIDERS = Object.entries(IS_SOCIAL_PROVIDER)
  .filter(([, isSocial]) => isSocial)
  .map(([providerId]) => providerId) as ProviderTypeSchema[];
