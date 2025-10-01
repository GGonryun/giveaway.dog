import {
  parseProviders,
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY,
  UserSchema
} from '@/schemas/user';
import { Prisma, PrismaClient } from '@prisma/client';
import { hoursToSeconds } from 'date-fns';
import { User } from 'next-auth';

export const userCache = {
  fn: ({ user }: { user: Required<User> | User | null }) => {
    // Skip caching for unauthenticated requests
    if (!user?.id) return undefined;

    return {
      keyParts: [`user-${user.id}`],
      tags: [`user-${user.id}`, 'user-profile'],
      revalidate: hoursToSeconds(1)
    };
  }
};

export const getUserQuery = async (db: PrismaClient, userId: string) => {
  const userData = await db.user.findUnique({
    where: { id: userId },
    select: USER_SCHEMA_SELECT_QUERY
  });

  if (!userData) {
    return null;
  }

  return toUserSchema(userData);
};
