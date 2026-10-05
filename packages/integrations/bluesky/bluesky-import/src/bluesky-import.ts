import 'server-only';

import { PrismaClient, UserSource } from '@giveaway/db-model';
import { nanoid } from 'nanoid';
import { BlueskyUserSchema } from '@giveaway/bluesky-api/get-bluesky-likes';

export interface ImportBlueskyParticipantsInput {
  sweepstakesId: string;
  taskId: string;
  blueskyUsers: BlueskyUserSchema[];
}

export type ImportedBlueskyUser = {
  userId: string;
  blueskyHandle: string;
  blueskyDid: string;
};

/**
 * Import Bluesky users as sweepstakes participants.
 *
 * This function:
 * 1. Checks if Bluesky account already exists in the system
 * 2. If exists: reuses the existing user
 * 3. If new: creates User + Account + UserQuality (score=30)
 *
 * When imported users later sign in with Bluesky, they are automatically
 * linked to their existing account via the Account table's composite key.
 */
export async function importBlueskyUsers(
  db: PrismaClient,
  input: ImportBlueskyParticipantsInput
) {
  const { blueskyUsers } = input;

  const imported: ImportedBlueskyUser[] = [];
  const existing: ImportedBlueskyUser[] = [];

  console.info(`Importing ${blueskyUsers.length} Bluesky users`);

  for (const blueskyUser of blueskyUsers) {
    try {
      const existingAccount = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'bluesky',
            providerAccountId: blueskyUser.did
          }
        },
        include: { user: true }
      });

      if (existingAccount?.userId) {
        existing.push({
          userId: existingAccount.userId,
          blueskyHandle: blueskyUser.handle,
          blueskyDid: blueskyUser.did
        });

        // Create/update scoring request for existing user with latest platform data
        await db.userScoringRequest.upsert({
          where: { userId: existingAccount.userId },
          create: { userId: existingAccount.userId },
          update: { updatedAt: new Date() }
        });

        continue;
      }

      const created = await db.user.create({
        data: {
          id: nanoid(),
          name: blueskyUser.displayName || blueskyUser.handle,
          email: null,
          image: blueskyUser.avatar,
          source: UserSource.BLUESKY_IMPORT,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'bluesky',
              providerAccountId: blueskyUser.did,
              label: blueskyUser.handle,
              link: `https://bsky.app/profile/${blueskyUser.handle}`
            }
          }
        }
      });

      // Create scoring request with enhanced platform data for immediate processing
      await db.userScoringRequest.create({
        data: { userId: created.id }
      });

      imported.push({
        userId: created.id,
        blueskyHandle: blueskyUser.handle,
        blueskyDid: blueskyUser.did
      });
    } catch (error) {
      console.error('Error importing Bluesky user', blueskyUser, error);
    }
  }

  return {
    imported,
    existing
  };
}
