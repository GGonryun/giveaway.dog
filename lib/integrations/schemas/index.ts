import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import z from 'zod';
import {
  TWITTER_SCOPE_GROUPS,
  BLUESKY_SCOPE_GROUPS,
  type TwitterFeatureSchema,
  type BlueskyFeatureSchema
} from '../scopes';
import { Nil } from '@/lib/types';

export const DEFAULT_INTEGRATION_LABEL = 'My Integration';
export const TWITTER_TEAM_APP_CLIENT_ID =
  process.env.TWITTER_TEAM_APP_CLIENT_ID;
export const TWITTER_TEAM_APP_CLIENT_SECRET =
  process.env.TWITTER_TEAM_APP_CLIENT_SECRET;
export const TWITTER_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/twitter-callback`;

export const integrationSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url().nullable(),
  account_id: z.string(),
  provider: z.nativeEnum(IntegrationProvider),
  status: z.nativeEnum(IntegrationStatus),
  scopes: z.array(z.string()).optional()
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
  integration: Nil<IntegrationSchema>,
  feature: TwitterFeatureSchema | BlueskyFeatureSchema
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

  return false;
}

export const integrationsSchema = z.array(integrationSchema);

export type IntegrationsSchema = z.infer<typeof integrationsSchema>;

export const twitterStateSchema = z.object({
  teamId: z.string(),
  codeVerifier: z.string()
});

export type TwitterStateSchema = z.infer<typeof twitterStateSchema>;
