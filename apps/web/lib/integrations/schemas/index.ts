import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import z from 'zod';
import {
  TWITTER_SCOPE_GROUPS,
  BLUESKY_SCOPE_GROUPS,
  TWITCH_SCOPE_GROUPS,
  type TwitterFeatureSchema,
  type BlueskyFeatureSchema,
  type TwitchFeatureSchema
} from '../scopes';
import { Nil } from '@giveaway/util-types/types';

export const DEFAULT_INTEGRATION_LABEL = 'MISSING_NO';
export const TWITTER_TEAM_APP_CLIENT_ID =
  process.env.TWITTER_TEAM_APP_CLIENT_ID;
export const TWITTER_TEAM_APP_CLIENT_SECRET =
  process.env.TWITTER_TEAM_APP_CLIENT_SECRET;
export const TWITTER_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/twitter-callback`;

export const integrationSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url().nullable(),
  account_id: z.string().nullable(),
  provider: z.nativeEnum(IntegrationProvider),
  status: z.nativeEnum(IntegrationStatus),
  scopes: z.array(z.string()).optional(),
  settings: z.unknown().optional(),
  state: z
    .object({
      id: z.string(),
      value: z.unknown(),
      expiresAt: z.coerce.date().nullish()
    })
    .nullish(),
  subscriptions: z
    .array(
      z.object({
        id: z.string(),
        twitch_id: z.string(),
        integrationId: z.string(),
        type: z.string(),
        version: z.string(),
        status: z.string(),
        broadcaster_user_id: z.string(),
        cost: z.number(),
        callback: z.string(),
        method: z.string(),
        created_at: z.coerce.date(),
        last_event_received_at: z.coerce.date().nullable()
      })
    )
    .optional()
});

export type IntegrationSchema = z.infer<typeof integrationSchema>;

export function hasScope(
  integration: IntegrationSchema | null | undefined,
  scope: string
): boolean {
  if (!integration?.scopes) return false;
  return integration.scopes.includes(scope);
}

// Type for Twitter integration
type TwitterIntegration = IntegrationSchema & {
  provider: typeof IntegrationProvider.TWITTER;
};

// Type for Bluesky integration
type BlueskyIntegration = IntegrationSchema & {
  provider: typeof IntegrationProvider.BLUESKY;
};

// Type for Twitch integration
type TwitchIntegration = IntegrationSchema & {
  provider: typeof IntegrationProvider.TWITCH;
};

// Function overloads for type safety
export function hasFeature(
  integration: Nil<TwitterIntegration>,
  feature: TwitterFeatureSchema
): boolean;
export function hasFeature(
  integration: Nil<BlueskyIntegration>,
  feature: BlueskyFeatureSchema
): boolean;
export function hasFeature(
  integration: Nil<TwitchIntegration>,
  feature: TwitchFeatureSchema
): boolean;
export function hasFeature(
  integration: Nil<IntegrationSchema>,
  feature: TwitterFeatureSchema | BlueskyFeatureSchema | TwitchFeatureSchema
): boolean {
  if (!integration?.scopes) return false;

  // Determine which scope group to use based on provider
  if (integration.provider === IntegrationProvider.TWITTER) {
    if (!integration.scopes) return false;
    const twitterFeature = feature as TwitterFeatureSchema;
    const requiredScopes =
      twitterFeature === 'GET_PROFILE'
        ? TWITTER_SCOPE_GROUPS[twitterFeature]
        : [
            ...TWITTER_SCOPE_GROUPS['GET_PROFILE'],
            ...TWITTER_SCOPE_GROUPS[twitterFeature]
          ];
    if (!requiredScopes) return false;
    return requiredScopes.every((scope) => integration.scopes!.includes(scope));
  }

  if (integration.provider === IntegrationProvider.BLUESKY) {
    if (!integration.scopes) return false;
    const blueskyFeature = feature as BlueskyFeatureSchema;
    const requiredScopes = BLUESKY_SCOPE_GROUPS[blueskyFeature];
    if (!requiredScopes) return false;
    return requiredScopes.every((scope) => integration.scopes!.includes(scope));
  }

  if (integration.provider === IntegrationProvider.TWITCH) {
    if (!integration.scopes) return false;
    const twitchFeature = feature as TwitchFeatureSchema;
    const requiredScopes = TWITCH_SCOPE_GROUPS[twitchFeature];
    if (!requiredScopes) return false;
    return requiredScopes.every((scope) => integration.scopes!.includes(scope));
  }

  return false;
}

export const integrationsSchema = z.array(integrationSchema);

export type IntegrationsSchema = z.infer<typeof integrationsSchema>;

export const twitterStateSchema = z.object({
  teamId: z.string(),
  codeVerifier: z.string()
});

export type TwitterStateSchema = z.infer<typeof twitterStateSchema>;
