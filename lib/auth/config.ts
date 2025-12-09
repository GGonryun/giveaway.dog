'server only';

import { authConfig } from './config-runtime';
import { createId } from '@paralleldrive/cuid2';

import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import TwitchProvider from 'next-auth/providers/twitch';
import InstagramProvider from 'next-auth/providers/instagram';
import TikTokProvider from 'next-auth/providers/tiktok';
import CredentialsProvider from 'next-auth/providers/credentials';

import { SteamProvider } from './providers/steam';
import { InboundEmailProvider } from './providers/inbound';
import { KickProvider } from './providers/kick';
import { FacebookProvider } from './providers/facebook';

import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_FACEBOOK_SCOPES
} from '../integrations/scopes';
import { UserSource } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth((request) => ({
  ...authConfig,
  providers: [
    TikTokProvider({
      clientId: process.env.TIKTOK_CLIENT_ID,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      userinfo:
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username,profile_web_link,profile_deep_link,is_verified',
      profile(profile) {
        return {
          id: profile.data.user.open_id,
          name: profile.data.user.display_name,
          image: profile.data.user.avatar_url,
          email: profile.data.user.email || profile.data.user.username || null,
          ...profile.data.user // --> any other fields provided by the provider
        };
      }
    }),
    CredentialsProvider({
      id: 'anonymous',
      name: 'Anonymous',
      credentials: {},
      authorize: async () => {
        const user = await prisma.user.create({
          data: {
            id: createId(),
            name: 'Anonymous',
            source: UserSource.ANONYMOUS
          }
        });

        return user;
      }
    }),
    SteamProvider({
      request,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/steam-callback`,
      clientSecret: process.env.STEAM_SECRET!
    }),
    FacebookProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: REQUIRED_FACEBOOK_SCOPES.join(' ')
        }
      }
    }),
    TwitterProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.TWITTER_LOGIN_APP_CLIENT_ID,
      clientSecret: process.env.TWITTER_LOGIN_APP_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.data?.id ?? profile.id,
          name: profile.data?.name ?? profile.name,
          email: profile.data?.email ?? profile.email,
          image: profile.data?.profile_image_url ?? profile.profile_image_url,
          username: profile.data?.username ?? profile.username
        } as any;
      }
    }),
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    DiscordProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.DISCORD_ID,
      clientSecret: process.env.DISCORD_SECRET,
      authorization: `https://discord.com/api/oauth2/authorize?scope=${REQUIRED_DISCORD_SCOPES.join('+')}`
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: REQUIRED_TWITCH_SCOPES.join(' '),
          claims: {
            id_token: {
              email: null,
              picture: null,
              preferred_username: null
            }
          }
        }
      }
    }),
    KickProvider({
      clientId: process.env.KICK_CLIENT_ID,
      clientSecret: process.env.KICK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: REQUIRED_KICK_SCOPES.join(' ')
        }
      }
    }),
    InboundEmailProvider({
      secret: process.env.INBOUND_SECRET
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!
    })
  ]
}));
