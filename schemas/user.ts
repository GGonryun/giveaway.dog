import { UserType } from '@/lib/prisma';
import z from 'zod';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  emoji: z.string().nullable(),
  providers: z.array(
    z.union([
      z.literal('twitter'),
      z.literal('google'),
      z.literal('discord'),
      z.literal('magic-link')
    ])
  ),
  emailVerified: z.date().nullable(),
  country: z.string().nullable(),
  type: z.nativeEnum(UserType).array()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const parseProviders = (providers: unknown) => {
  if (!Array.isArray(providers)) {
    return [];
  }
  if (providers.length === 0) {
    return [];
  }

  if (providers.some((provider) => typeof provider !== 'string')) {
    return [];
  }

  return providers.filter((provider) =>
    ['twitter', 'google', 'discord', 'magic-link'].includes(provider)
  );
};
