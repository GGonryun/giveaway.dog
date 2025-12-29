import { PrismaClient, UserSource } from '@prisma/client';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { nanoid } from 'nanoid';
import { BlueskyUserSchema } from '../integrations/procedures/get-bluesky-likes';

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
          },
          quality: {
            create: {
              score: USER_BASE_SCORE,
              metrics: {
                baseScore: USER_BASE_SCORE,
                deviceStability: 0,
                ipConsistency: 0,
                geoConsistency: 0,
                providersConnected: 0,
                emailVerified: 0,
                taskActivity: 0,
                taskDiversity: 0,
                accountAge: 0,
                overlappingIpAddresses: 0,
                overlappingFingerprints: 0
              }
            }
          }
        }
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
