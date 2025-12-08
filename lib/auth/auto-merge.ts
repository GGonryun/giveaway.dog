import { Account, Profile, Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { getAccountLabel, getAccountLink } from './get-account-data';
import { Prisma } from '@prisma/client';

export const tryAutoMerge = async (args: {
  existing: Prisma.AccountGetPayload<{
    include: { user: { select: { id: true; source: true } } };
  }>;
  account: Account;
  profile: Profile;
  session: Session | null;
}) => {
  const { existing, account, session, profile } = args;

  console.log('Trying to auto-merge accounts:', {
    existing,
    account,
    session,
    profile
  });
  if (
    existing.provider === account.provider &&
    existing.providerAccountId === account.providerAccountId
  ) {
    // Same account, no merge needed, user is doing a reconnect
    return true;
  }

  if (existing.user.source !== 'TWITTER_IMPORT') return false;

  if (!session || !session?.user?.id) {
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId
        }
      },
      data: {
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token
      }
    });

    return true;
  }

  await prisma.$transaction(async (tx) => {
    // add a new account for the current user
    const currentUserId = session?.user?.id as string;
    await tx.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId
        }
      },
      data: {
        userId: currentUserId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        label: getAccountLabel(account, profile.data),
        link: getAccountLink(account, profile.data)
      }
      // reassign the task completions to the new user
    });
    await tx.taskCompletion.updateMany({
      where: {
        userId: existing.user.id
      },
      data: {
        userId: currentUserId
      }
    });
    // delete the old user
    await tx.user.delete({
      where: {
        id: existing.user.id
      }
    });
  });

  return '/account?merged_x=true';
};
