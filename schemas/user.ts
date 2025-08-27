import { UserType } from '@prisma/client';
import z from 'zod';

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  age: z.number().nullable(),
  region: z.string().nullable(),
  emoji: z.string().nullable(),
  emailVerified: z.boolean().nullable(),
  type: z.nativeEnum(UserType).array(),
  providers: z.array(
    z.union([
      z.literal('twitter'),
      z.literal('google'),
      z.literal('discord'),
      z.literal('magic-link')
    ])
  )
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

export const updateUserProfileSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  age: z.number().nullable(),
  region: z.string().nullable(),
  emoji: z.string().nullable(),
  type: z.array(z.nativeEnum(UserType)).nullable()
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
