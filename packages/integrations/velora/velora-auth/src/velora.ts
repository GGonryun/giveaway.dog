import 'server-only';

import { OAuthUserConfig, OAuthConfig } from 'next-auth/providers';
import { z } from 'zod';

export const VeloraCreatorSchema = z.object({
  id: z.string(),
  slug: z.string(),
  channelName: z.string(),
  description: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  status: z.string(),
  tier: z.string(),
  followerCount: z.number(),
  totalStreamHours: z.number(),
  totalRevenue: z.string().optional(),
  stripeConnectAccountId: z.string().nullable().optional(),
  stripeOnboardingComplete: z.boolean().optional(),
  youtubeChannelId: z.string().nullable().optional(),
  youtubeRefreshToken: z.string().nullable().optional(),
  totalViews: z.number().optional(),
  subscriptionPrice: z.number().optional(),
  revenueSharePercentage: z.string().optional(),
  socialLinks: z.any().nullable().optional(),
  streamSettings: z.any().nullable().optional(),
  emoteSlots: z.number().optional(),
  channelEmoteSlots: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  approvedAt: z.string().nullable().optional()
});

export const VeloraProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().nullish(),
  displayName: z.string().nullish(),
  bio: z.string().nullish(),
  role: z.string().optional(),
  status: z.string().optional(),
  streamingEnabled: z.boolean().optional(),
  followerCount: z.number().optional(),
  followingCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  creator: VeloraCreatorSchema.nullable().optional(),
  accentColor: z.string().nullable().optional(),
  profileCustomization: z
    .object({
      accentColor: z.string().nullable()
    })
    .nullable()
    .optional(),
  developerAccess: z.boolean().optional(),
  developerTier: z.string().nullable().optional(),
  rateLimitOverride: z.any().nullable().optional(),
  youtubeConnected: z.boolean().optional(),
  totalViews: z.number().optional(),
  totalStreamHours: z.number().optional(),
  staffBadgeVisible: z.boolean().optional(),
  emailVerifiedAt: z.string().nullable().optional(),
  preferences: z.any().nullable().optional(),
  canMonetize: z.boolean().optional()
});

export type VeloraProfile = z.infer<typeof VeloraProfileSchema>;

export function VeloraProvider(
  options: OAuthUserConfig<VeloraProfile>
): OAuthConfig<VeloraProfile> {
  return {
    id: 'velora',
    name: 'Velora',
    type: 'oauth',
    client: {
      token_endpoint_auth_method: 'client_secret_post'
    },
    authorization: {
      url: 'https://velora.tv/oauth/authorize',
      params: {
        response_type: 'code',
        scope: 'user:read'
      }
    },
    token: {
      url: 'https://api.velora.tv/api/developer/oauth/token',
      conform: async (response: Response) => {
        if (response.status === 201) {
          const text = await response.text();
          return new Response(text, {
            status: 200,
            headers: response.headers
          });
        }
        return response;
      }
    },
    userinfo: {
      url: 'https://api.velora.tv/api/users/me',
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const response = await fetch('https://api.velora.tv/api/users/me', {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Velora userinfo failed: ${response.status} - ${text}`
          );
        }
        return response.json();
      }
    },
    checks: ['pkce', 'state'],
    profile(profile) {
      const parsed = VeloraProfileSchema.parse(profile);
      return {
        id: parsed.id,
        name: parsed.displayName || parsed.username,
        email: parsed.email ?? null,
        image: null
      };
    },
    style: {
      bg: '#7c3aed',
      text: '#fff'
    },
    options
  };
}
