import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import z from 'zod';

export const DEFAULT_INTEGRATION_LABEL = 'My Integration';
export const TWITTER_TEAM_APP_CLIENT_ID =
  process.env.TWITTER_TEAM_APP_CLIENT_ID;
export const TWITTER_TEAM_APP_CLIENT_SECRET =
  process.env.TWITTER_TEAM_APP_CLIENT_SECRET;
export const TWITTER_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/twitter-callback`;

export const integrationSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.nativeEnum(IntegrationProvider),
  status: z.nativeEnum(IntegrationStatus)
});

export type IntegrationSchema = z.infer<typeof integrationSchema>;

export const integrationsSchema = z.array(integrationSchema);

export type IntegrationsSchema = z.infer<typeof integrationsSchema>;

export const twitterStateSchema = z.object({
  teamId: z.string(),
  codeVerifier: z.string()
});

export type TwitterStateSchema = z.infer<typeof twitterStateSchema>;
