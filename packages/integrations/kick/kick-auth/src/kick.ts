import 'server-only';

import { OAuthUserConfig, OAuthConfig } from 'next-auth/providers';

export interface KickProfile {
  data: Array<{
    /**
     * Unique identifier for the user.
     */
    user_id: number;
    /**
     * Display name of the user.
     */
    name: string;
    /**
     * Email address of the user.
     */
    email: string;
    /**
     * URL of the user's profile picture.
     */
    profile_picture: string;
  }>;
  /**
   * Response message from the API.
   */
  message: string;
}

export function KickProvider(
  options: OAuthUserConfig<KickProfile>
): OAuthConfig<KickProfile> {
  return {
    id: 'kick',
    name: 'Kick',
    type: 'oauth',
    client: {
      token_endpoint_auth_method: 'client_secret_post'
    },
    authorization: {
      url: 'https://id.kick.com/oauth/authorize',
      params: {
        response_type: 'code',
        scope: 'user:read'
      }
    },
    token: 'https://id.kick.com/oauth/token',
    userinfo: 'https://api.kick.com/public/v1/users',
    checks: ['pkce', 'state'],
    profile(profile) {
      // Extract user data from the API response structure
      const userData = profile.data[0]!;
      return {
        id: String(userData.user_id),
        name: userData.name,
        email: userData.email,
        image: userData.profile_picture
      };
    },
    style: {
      bg: '#53fc18',
      text: '#000'
    },
    options
  };
}
