import { parseProviders } from '@/schemas/user';
import { PrismaClient } from '@prisma/client';
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
    select: {
      id: true,
      email: true,
      name: true,
      emoji: true,
      region: true,
      age: true,
      emailVerified: true,
      type: true,
      accounts: {
        select: { provider: true }
      }
    }
  });

  if (!userData) {
    return null;
  }

  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    emoji: userData.emoji,
    region: userData.region,
    age: userData.age,
    emailVerified: !!userData.emailVerified,
    type: userData.type,
    providers: parseProviders(
      userData.accounts.map((account) => account.provider)
    )
  };
};
