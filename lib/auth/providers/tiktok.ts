import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

export interface TiktokProfile extends Record<string, any> {
  data: {
    user: {
      open_id: string;
      union_id?: string;
      avatar_url: string;
      avatar_url_100?: string;
      avatar_large_url?: string;
      display_name: string;
      username: string;
      email?: string;
      bio_description?: string;
      profile_deep_link?: string;
      is_verified?: boolean;
      follower_count?: number;
      following_count?: number;
      likes_count?: number;
      video_count?: number;
    };
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export function TikTok<P extends TiktokProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'tiktok',
    name: 'TikTok',
    type: 'oauth',
    authorization: {
      url: 'https://www.tiktok.com/v2/auth/authorize',
      params: {
        client_key: options.clientId,
        scope: 'user.info.profile',
        response_type: 'code'
      }
    },

    token: {
      url: 'https://open.tiktokapis.com/v2/oauth/token/',
      async request({ params, provider }: any) {
        const res = await fetch(provider.token?.url as unknown as string, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_key: provider.clientId!,
            client_secret: provider.clientSecret!,
            code: params.code!,
            grant_type: 'authorization_code',
            redirect_uri: provider.callbackUrl!
          })
        }).then((res) => res.json());

        const tokens: any = {
          access_token: res.access_token,
          expires_at: res.expires_in,
          refresh_token: res.refresh_token,
          scope: res.scope,
          id_token: res.open_id,
          token_type: res.token_type,
          session_state: res.open_id
        };
        return {
          tokens
        };
      }
    },
    userinfo: {
      url: 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username,profile_deep_link',
      async request({ tokens, provider }: any) {
        try {
          return await fetch(provider.userinfo?.url as URL, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          }).then(async (res) => await res.json());
        } catch (error) {
          console.error('Error fetching TikTok user info:', error);
          throw error;
        }
      }
    },
    profile(profile) {
      return {
        id: profile.data.user.open_id,
        name: profile.data.user.display_name,
        image: profile.data.user.avatar_url,
        email: profile.data.user.email || profile.data.user.username || null,
        link: profile.data.user.profile_deep_link || null
      };
    },
    style: {
      bg: '#000',
      text: '#fff'
    },
    options
  };
}
