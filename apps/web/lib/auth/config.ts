import 'server-only';

import { createAuthConfig } from './config-runtime';
import { createId } from '@paralleldrive/cuid2';

import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import TwitchProvider from 'next-auth/providers/twitch';
import LinkedInProvider from 'next-auth/providers/linkedin';
import TikTokProvider from 'next-auth/providers/tiktok';
import CredentialsProvider from 'next-auth/providers/credentials';

import { SteamProvider } from './providers/steam';
import { InboundEmailProvider } from './providers/inbound';
import { KickProvider } from './providers/kick';
import { VeloraProvider } from './providers/velora';
import { newE2eProviders } from './providers/e2e';

import {
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_VELORA_SCOPES,
  REQUIRED_LINKEDIN_SCOPES
} from '../integrations/scopes';
import { UserSource } from '@prisma/client';
import prisma from '@/lib/prisma';
import { redeemBlueskyLoginToken } from './bluesky-login-token';

const authConfig = createAuthConfig(() => auth());

export const { handlers, signIn, signOut, auth } = NextAuth((request) => ({
  ...authConfig,
  providers: [
    TikTokProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.TIKTOK_CLIENT_ID,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,

      profile(profile) {
        return {
          id: profile.data.user.open_id,
          name: profile.data.user.display_name || profile.data.user.username,
          image: profile.data.user.avatar_url,
          email: profile.data.user.email || profile.data.user.username || null
        };
      }
    }),
    CredentialsProvider({
      id: 'anonymous',
      name: 'Anonymous',
      credentials: {},
      authorize: async () => {
        try {
          return await prisma.user.create({
            data: {
              id: createId(),
              name: 'Anonymous',
              source: UserSource.ANONYMOUS
            }
          });
        } catch (error) {
          console.error('Error creating anonymous user:', error);
          throw error;
        }
      }
    }),
    CredentialsProvider({
      id: 'bluesky-direct',
      name: 'Bluesky Direct',
      credentials: {
        token: { label: 'Login Token', type: 'text' }
      },
      authorize: async (credentials) =>
        redeemBlueskyLoginToken(credentials?.token)
    }),
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
      allowDangerousEmailAccountLinking: true,
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
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.KICK_CLIENT_ID,
      clientSecret: process.env.KICK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: REQUIRED_KICK_SCOPES.join(' ')
        }
      }
    }),
    VeloraProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.VELORA_CLIENT_ID,
      clientSecret: process.env.VELORA_CLIENT_SECRET,
      authorization: {
        params: {
          scope: REQUIRED_VELORA_SCOPES.join(' ')
        }
      }
    }),
    InboundEmailProvider({
      secret: process.env.INBOUND_SECRET
    }),
    LinkedInProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: { params: { scope: REQUIRED_LINKEDIN_SCOPES.join(' ') } },
      async profile(profile, tokens) {
        let linkedInProfileUrl: string | null = null;
        try {
          const res = await fetch('https://api.linkedin.com/rest/identityMe', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'LinkedIn-Version': '202411'
            }
          });
          if (res.ok) {
            const data = await res.json();
            console.log('LinkedIn identity data', data);
            linkedInProfileUrl = data.basicInfo?.profileUrl ?? null;
          } else {
            const body = await res.text();
            console.error('Failed to fetch LinkedIn identity', {
              status: res.status,
              statusText: res.statusText,
              body
            });
          }
        } catch (error) {
          console.error('Failed to fetch LinkedIn identity', error);
        }
        return {
          id: profile.sub as string,
          name: profile.name as string,
          email: profile.email as string,
          image: profile.picture as string,
          linkedInProfileUrl
        };
      }
    }),
    ...newE2eProviders()
  ]
}));
