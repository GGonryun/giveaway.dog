'server only';

import NextAuth, { Session } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import NodemailerProvider from 'next-auth/providers/nodemailer';
import { authConfig } from './auth.config';
import { RecursiveRequired } from '../types';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    TwitterProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
      profile(profile) {
        return {
          id: profile.data?.id ?? profile.id,
          name: profile.data?.name ?? profile.name,
          email: profile.data?.email ?? profile.email,
          image: profile.data?.profile_image_url ?? profile.profile_image_url
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
      clientSecret: process.env.DISCORD_SECRET
    }),
    NodemailerProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM
    })
  ]
});

export const isValidSession = (
  session: Session | null
): session is RecursiveRequired<Session> => {
  if (!session || !session.user || !session.user.id) return false;
  const now = new Date();
  const expiration = new Date(session.expires);
  return now < expiration;
};
