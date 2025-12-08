/**
 * <div style={{backgroundColor: "#000", display: "flex", justifyContent: "space-between", color: "#fff", padding: 16}}>
 * <span>Built-in <b>Facebook</b> integration.</span>
 * <a href="https://facebook.com">
 *   <img style={{display: "block"}} src="https://authjs.dev/img/providers/facebook.svg" height="48" width="48"/>
 * </a>
 * </div>
 *
 * @module providers/facebook
 */

import { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

interface FacebookPictureData {
  url: string;
}

interface FacebookPicture {
  data: FacebookPictureData;
}

export interface FacebookProfile extends Record<string, any> {
  id: string;
  name: string;
  email: string;
  picture: FacebookPicture;
  link: string;
}

export function FacebookProvider<P extends FacebookProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'facebook',
    name: 'Facebook',
    type: 'oauth',
    authorization: {
      url: 'https://www.facebook.com/v19.0/dialog/oauth',
      params: {
        scope: 'email'
      }
    },
    token: 'https://graph.facebook.com/oauth/access_token',
    userinfo: {
      // https://developers.facebook.com/docs/graph-api/reference/user/#fields
      url: 'https://graph.facebook.com/me?fields=id,name,email,picture,link',
      async request({ tokens, provider }: any) {
        return await fetch(provider.userinfo?.url as URL, {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        }).then(async (res) => await res.json());
      }
    },
    profile(profile: P) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        link: profile.link,
        image: profile.picture.data.url
      };
    },
    style: { bg: '#006aff', text: '#fff' },
    options
  };
}
