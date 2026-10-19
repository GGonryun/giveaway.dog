import { z } from 'zod';
import { isE2eEmail } from './personas';

export const E2E_OAUTH_PROVIDERS = ['discord'] as const;

export type E2eOAuthProvider = (typeof E2E_OAUTH_PROVIDERS)[number];

export const E2E_OAUTH_SECRET_COOKIE = 'e2e-oauth';

export const toE2eOAuthProfileCookie = (provider: E2eOAuthProvider) =>
  `e2e-oauth-${provider}`;

export const E2E_OAUTH_AUTHORIZE_PATH = '/api/e2e/oauth/authorize';

export const E2E_OAUTH_CODE = 'e2e-oauth-code';

export const E2E_OAUTH_ACCESS_TOKEN = 'e2e-oauth-access-token';

export const E2E_OAUTH_SERVER = 'https://e2e-oauth.invalid';

const e2eOAuthEmailSchema = z.string().refine(isE2eEmail);

export const e2eDiscordProfileSchema = z
  .object({
    id: z.string().regex(/^\d{1,20}$/),
    username: z.string().min(1).max(32),
    global_name: z.string().min(1).max(32).nullable().default(null),
    email: e2eOAuthEmailSchema,
    verified: z.boolean().default(true),
    avatar: z.null().default(null),
    discriminator: z.literal('0').default('0')
  })
  .strict();

export type E2eDiscordProfile = z.input<typeof e2eDiscordProfileSchema>;

export type E2eOAuthProfiles = {
  discord: E2eDiscordProfile;
};

const E2E_OAUTH_PROFILE_SCHEMAS = {
  discord: e2eDiscordProfileSchema
} satisfies Record<E2eOAuthProvider, z.ZodTypeAny>;

export const toE2eOAuthProfileCookieValue = (profile: object) =>
  encodeURIComponent(JSON.stringify(profile));

export const parseE2eOAuthProfile = (
  provider: E2eOAuthProvider,
  value: string | undefined
): Record<string, unknown> | null => {
  try {
    const parsed = E2E_OAUTH_PROFILE_SCHEMAS[provider].safeParse(
      JSON.parse(decodeURIComponent(String(value)))
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
