import { PrismaClient, UserSource } from '@prisma/client';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { nanoid } from 'nanoid';

export interface TwitterUser {
  id: string; // Twitter user ID
  username: string; // @handle
  name: string; // Display name
  profile_image_url?: string;
}

export interface ImportTwitterParticipantsInput {
  sweepstakesId: string;
  taskId: string;
  twitterUsers: TwitterUser[];
}

export interface ImportTwitterParticipantsResult {
  imported: number; // New users created
  existing: number; // Users that already existed
  entries: number; // Task completions created
  errors: Array<{ twitterUserId: string; error: string }>;
}

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
export async function importTwitterParticipantsAsSweepstakes(
  db: PrismaClient,
  input: ImportTwitterParticipantsInput
): Promise<ImportTwitterParticipantsResult> {
  const { sweepstakesId, taskId, twitterUsers } = input;

  const result: ImportTwitterParticipantsResult = {
    imported: 0,
    existing: 0,
    entries: 0,
    errors: []
  };

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

      let userId: string;

      if (existingAccount) {
        // User already exists (either imported before or signed up)
        userId = existingAccount.userId;
        result.existing++;
      } else {
        // Create new imported user
        const newUser = await db.user.create({
          data: {
            id: nanoid(),
            name: twitterUser.name || twitterUser.username,
            email: null, // Twitter API doesn't provide email for likers
            image: twitterUser.profile_image_url,
            source: UserSource.TWITTER_IMPORT
          }
        });

        // Create Twitter account link
        await db.account.create({
          data: {
            userId: newUser.id,
            type: 'oauth',
            provider: 'twitter',
            providerAccountId: twitterUser.id,
            label: twitterUser.username
          }
        });

        // Create quality score with base score of 30
        await db.userQuality.create({
          data: {
            userId: newUser.id,
            score: USER_BASE_SCORE,
            metrics: {
              baseScore: USER_BASE_SCORE,
              deviceStability: 0,
              ipConsistency: 0,
              geoConsistency: 0,
              providersConnected: 2, // Twitter account
              emailVerified: 0,
              taskActivity: 0,
              taskDiversity: 0,
              accountAge: 0,
              overlappingIpAddresses: 0,
              overlappingFingerprints: 0
            }
          }
        });

        userId = newUser.id;
        result.imported++;
      }

      // Check if entry already exists for this user/task combination
      const existingEntry = await db.taskCompletion.findFirst({
        where: {
          userId,
          taskId
        }
      });

      if (!existingEntry) {
        // Create task completion
        await db.taskCompletion.create({
          data: {
            userId,
            taskId,
            status: 'COMPLETED',
            proof: {
              source: 'twitter_import',
              twitterUserId: twitterUser.id,
              twitterUsername: twitterUser.username,
              importedAt: new Date().toISOString()
            }
          }
        });

        result.entries++;
      }
    } catch (error) {
      result.errors.push({
        twitterUserId: twitterUser.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return result;
}
