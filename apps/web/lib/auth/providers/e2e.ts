import { createHash, timingSafeEqual } from 'crypto';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserAccountType } from '@prisma/client';
import prisma from '@/lib/prisma';

export const E2E_USER_EMAIL = 'e2e-host@example.com';

const MIN_SECRET_LENGTH = 32;

const verifyTestEnvironment = () =>
  process.env.VERCEL_ENV === 'preview' ||
  process.env.NODE_ENV === 'development';

const getE2eLoginSecret = () => {
  const secret = process.env.E2E_LOGIN_SECRET;
  if (!verifyTestEnvironment()) return undefined;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return undefined;
  return secret;
};

const digest = (value: string) => createHash('sha256').update(value).digest();

const verifySecret = (given: unknown, secret: string) =>
  typeof given === 'string' && timingSafeEqual(digest(given), digest(secret));

export const newE2eProviders = () => {
  const secret = getE2eLoginSecret();
  if (!secret) return [];

  return [
    CredentialsProvider({
      id: 'e2e',
      name: 'E2E',
      credentials: { secret: { label: 'Secret', type: 'password' } },
      authorize: async (credentials) => {
        if (!verifySecret(credentials?.secret, secret)) return null;

        return await prisma.user.upsert({
          where: { email: E2E_USER_EMAIL },
          update: { accountType: UserAccountType.HOST, onboarded: true },
          create: {
            email: E2E_USER_EMAIL,
            emailVerified: new Date(),
            name: 'E2E Host',
            accountType: UserAccountType.HOST,
            onboarded: true
          }
        });
      }
    })
  ];
};
