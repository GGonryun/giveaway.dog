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
  totalStreamHours: z.number()
});

export const VeloraProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  streamingEnabled: z.boolean(),
  followerCount: z.number(),
  followingCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  creator: VeloraCreatorSchema.nullable().optional(),
  accentColor: z.string().nullable(),
  profileCustomization: z
    .object({
      accentColor: z.string().nullable()
    })
    .nullable()
    .optional()
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
        email: parsed.email,
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
