import { PrismaClient, UserSource } from '@prisma/client';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { nanoid } from 'nanoid';
import { TwitterUserSchema } from '../integrations/schemas/api';

export interface ImportTwitterParticipantsInput {
  sweepstakesId: string;
  taskId: string;
  twitterUsers: TwitterUserSchema[];
}

export type ImportedUser = {
  userId: string;
  twitterUsername: string;
  twitterUserId: string;
};

/**
 * Import Twitter users as sweepstakes participants.
 *
 * This function:
 * 1. Checks if Twitter account already exists in the system
 * 2. If exists: reuses the existing user
 * 3. If new: creates User + Account + UserQuality (score=30)
 * 4. Creates TaskCompletion for the sweepstakes task
 *
 * When imported users later sign in with Twitter, they are automatically
 * linked to their existing account via the Account table's composite key.
 */
export async function importTwitterUsers(
  db: PrismaClient,
  input: ImportTwitterParticipantsInput
) {
  const { twitterUsers } = input;

  const imported: ImportedUser[] = [];
  const existing: ImportedUser[] = [];

  console.info(`Importing ${twitterUsers.length} Twitter users`);
  for (const twitterUser of twitterUsers) {
    try {
      // Check if Twitter account already exists
      const existingAccount = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'twitter',
            providerAccountId: twitterUser.id
          }
        },
        include: { user: true }
      });

      if (existingAccount?.userId) {
        existing.push({
          userId: existingAccount.userId,
          twitterUsername: twitterUser.username,
          twitterUserId: twitterUser.id
        });
        continue;
      }

      const created = await db.user.create({
        data: {
          id: nanoid(),
          name: twitterUser.name || twitterUser.username,
          email: null, // Twitter API doesn't provide email for likers
          image: twitterUser.profile_image_url,
          source: UserSource.TWITTER_IMPORT,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'twitter',
              providerAccountId: twitterUser.id,
              label: twitterUser.username,
              link: `https://x.com/${twitterUser.username}`
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
                providersConnected: 0, // Twitter account
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
        twitterUsername: twitterUser.username,
        twitterUserId: twitterUser.id
      });
    } catch (error) {
      console.error('Error importing Twitter user', twitterUser, error);
    }
  }

  return {
    imported,
    existing
  };
}
