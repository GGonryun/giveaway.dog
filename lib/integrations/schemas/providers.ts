import { Nil } from '@/lib/types';
import z from 'zod';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES,
  REQUIRED_TWITCH_SCOPES
} from '../scopes';

export const providerTypeSchema = z.union([
  z.literal('twitter'),
  z.literal('google'),
  z.literal('discord'),
  z.literal('email'),
  z.literal('steam'),
  z.literal('twitch')
]);

export type ProviderTypeSchema = z.infer<typeof providerTypeSchema>;

export const PROVIDER_REQUIRED_SCOPES: Record<ProviderTypeSchema, string[]> = {
  email: [],
  discord: REQUIRED_DISCORD_SCOPES,
  twitter: REQUIRED_TWITTER_SCOPES,
  steam: REQUIRED_STEAM_SCOPES,
  google: REQUIRED_GMAIL_SCOPES,
  twitch: REQUIRED_TWITCH_SCOPES
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

export type ProviderSchema = z.infer<typeof providerSchema>;

export const PROVIDER_SCHEMA_LABELS: Record<ProviderTypeSchema, string> = {
  twitter: 'X (Twitter)',
  google: 'Google',
  discord: 'Discord',
  email: 'Email',
  twitch: 'Twitch',
  steam: 'Steam'
};

export const IS_SOCIAL_PROVIDER: Record<ProviderTypeSchema, boolean> = {
  twitter: true,
  google: true,
  discord: true,
  steam: true,
  twitch: true,
  email: false
};

export const SOCIAL_PROVIDERS = Object.entries(IS_SOCIAL_PROVIDER)
  .filter(([, isSocial]) => isSocial)
  .map(([providerId]) => providerId) as ProviderTypeSchema[];
