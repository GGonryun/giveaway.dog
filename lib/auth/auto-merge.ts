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
  console.info('tryAutoMerge called for account:', account, existing, session);

  // If the existing account's user source is not from a Twitter import, do
  // not merge. Otherwise the twitter import account merge would have matching
  // provider/providerAccountId and we want to complete a full upgrade
  if (existing.user?.source !== 'TWITTER_IMPORT') {
    if (
      existing.provider === account.provider &&
      existing.providerAccountId === account.providerAccountId
    ) {
      // Check if the existing account belongs to the current session user
      if (session?.user?.id && existing.userId !== session.user.id) {
        console.info(
          'Not merging, account belongs to different user',
          existing.userId,
          'vs',
          session.user.id
        );
        return false;
      }
      console.info(
        'Not merging, same provider and providerAccountId',
        existing.providerAccountId,
        account.providerAccountId
      );
      // Same account, no merge needed, user is doing a reconnect
      return true;
    }
    console.info(
      'Not merging, existing account user source is:',
      existing.user?.source
    );
    return false;
  }

  // this gets called if this user is signing in for the first time with twitter
  // and the account already exists because it was imported previously from
  // twitter import.
  if (!session || !session?.user?.id) {
    console.info('No session user, claiming imported Twitter account');

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
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

      await tx.user.update({
        where: {
          id: existing.user?.id
        },
        data: {
          source: 'SIGNUP'
        }
      });
    });

    return true;
  }

  // this gets called when the user is signed in and is trying to link an
  // account that was previously imported from twitter. The old account
  // needs to be merged into the current session user and the old user deleted.
  console.info('Auto-merging accounts for session user:', session.user.id);
  try {
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
      // find all of this user's participation and reassign to current user
      // First, find sweepstakes where both users participated (would cause conflicts)
      const conflictingSweepstakesIds =
        await tx.sweepstakesParticipant.findMany({
          where: {
            userId: currentUserId
          },
          select: {
            sweepstakesId: true
          }
        });

      const conflictingIds = conflictingSweepstakesIds.map(
        (p) => p.sweepstakesId
      );

      // Delete old user's participations that would conflict
      await tx.sweepstakesParticipant.deleteMany({
        where: {
          userId: existing.user?.id,
          sweepstakesId: {
            in: conflictingIds
          }
        }
      });

      // Update remaining participations to current user
      await tx.sweepstakesParticipant.updateMany({
        where: {
          userId: existing.user?.id
        },
        data: {
          userId: currentUserId
        }
      });
      // delete the old user
      await tx.user.delete({
        where: {
          id: existing.user?.id
        }
      });
    });
  } catch (error) {
    console.error('Error during auto-merge transaction:', error);
    return false;
  }

  return '/account?merged=true';
};
