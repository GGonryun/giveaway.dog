'server only';

import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import TwitchProvider from 'next-auth/providers/twitch';
import InstagramProvider from 'next-auth/providers/instagram';

import { authConfig } from './config-runtime';
import { SteamProvider } from './providers/steam';
import { InboundEmailProvider } from './providers/inbound';

import KickProvider from './providers/kick';
import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES
} from '../integrations/scopes';

export const { handlers, signIn, signOut, auth } = NextAuth((request) => ({
  ...authConfig,
  providers: [
    SteamProvider({
      request,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/steam-callback`,
      clientSecret: process.env.STEAM_SECRET!
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
