import { PrismaClient, UserSource } from '@prisma/client';
import { USER_BASE_SCORE } from '@/schemas/user-scoring';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

/**
 * Seed script to import a fake Twitter user for testing the Twitter import feature.
 *
 * Usage:
 *   npx tsx scripts/seed-twitter-import.ts [sweepstakesId] [taskId]
 *
 * Example:
 *   npx tsx scripts/seed-twitter-import.ts clg1234567 clh7890123
 *
 * If no sweepstakesId/taskId provided, only creates the user without task completion.
 */

const FAKE_TWITTER_USER = {
  id: '1948567947976605699',
  name: 'TheGiveawayDog',
  username: 'TheGiveawayDog',
  verified: false,
  protected: false,
  created_at: '2025-07-08T11:14:16.000Z',
  description: '',
  verified_type: 'none',
  public_metrics: {
    tweet_count: 1007,
    listed_count: 0,
    followers_count: 9,
    following_count: 114
  },
  profile_image_url:
    'https://pbs.twimg.com/profile_images/1942542749322076162/gC4FgdXx_normal.png'
};

async function main() {
  const args = process.argv.slice(2);
  const sweepstakesId = args[0];
  const taskId = args[1];

  console.log('🐦 Starting Twitter user import seed script...\n');

  // Check if Twitter account already exists
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'twitter',
        providerAccountId: FAKE_TWITTER_USER.id
      }
    },
    include: { user: true }
  });

  let userId: string;

  if (existingAccount) {
    console.log(
      `✅ Twitter account already exists for user: ${existingAccount.user.name} (${existingAccount.userId})`
    );
    userId = existingAccount.userId;
  } else {
    console.log('📝 Creating new imported Twitter user...');

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: nanoid(),
        name: FAKE_TWITTER_USER.name,
        email: null, // No email for Twitter imports
        image: FAKE_TWITTER_USER.profile_image_url,
        source: UserSource.TWITTER_IMPORT
      }
    });

    console.log(`✅ Created user: ${newUser.name} (${newUser.id})`);

    // Create Twitter account link
    await prisma.account.create({
      data: {
        userId: newUser.id,
        type: 'oauth',
        provider: 'twitter',
        providerAccountId: FAKE_TWITTER_USER.id,
        label: FAKE_TWITTER_USER.username
      }
    });

    console.log(`✅ Linked Twitter account: @${FAKE_TWITTER_USER.username}`);

    // Create quality score
    await prisma.userQuality.create({
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

    console.log(
      `✅ Created quality score: ${USER_BASE_SCORE} (base score for imports)`
    );

    userId = newUser.id;
  }

  // If sweepstakesId and taskId provided, create task completion
  if (sweepstakesId && taskId) {
    console.log(`\n📋 Creating task completion for sweepstakes...`);

    // Verify sweepstakes exists
    const sweepstakes = await prisma.sweepstakes.findUnique({
      where: { id: sweepstakesId }
    });

    if (!sweepstakes) {
      console.error(`❌ Sweepstakes not found: ${sweepstakesId}`);
      process.exit(1);
    }

    // Verify task exists and belongs to sweepstakes
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        sweepstakesId: sweepstakesId
      }
    });

    if (!task) {
      console.error(
        `❌ Task not found or doesn't belong to sweepstakes: ${taskId}`
      );
      process.exit(1);
    }

    // Check if entry already exists
    const existingEntry = await prisma.taskCompletion.findFirst({
      where: {
        userId,
        taskId
      }
    });

    if (existingEntry) {
      console.log(`⚠️  Task completion already exists for this user and task`);
    } else {
      // Create task completion
      const completion = await prisma.taskCompletion.create({
        data: {
          userId,
          taskId,
          status: 'COMPLETED',
          proof: {
            source: 'twitter_import_seed',
            twitterUserId: FAKE_TWITTER_USER.id,
            twitterUsername: FAKE_TWITTER_USER.username,
            importedAt: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Created task completion: ${completion.id}`);
    }
  }

  console.log('\n✨ Seed complete!\n');
  console.log('User Details:');
  console.log(`  ID: ${userId}`);
  console.log(`  Name: ${FAKE_TWITTER_USER.name}`);
  console.log(`  Username: @${FAKE_TWITTER_USER.username}`);
  console.log(`  Twitter ID: ${FAKE_TWITTER_USER.id}`);
  console.log(`  Source: TWITTER_IMPORT`);
  console.log(`  Quality Score: ${USER_BASE_SCORE}`);

  if (sweepstakesId && taskId) {
    console.log(`\nTask Completion:`);
    console.log(`  Sweepstakes: ${sweepstakesId}`);
    console.log(`  Task: ${taskId}`);
  } else {
    console.log(
      '\n💡 Tip: Run with sweepstakesId and taskId to create a task completion:'
    );
    console.log(
      '   npx tsx scripts/seed-twitter-import.ts <sweepstakesId> <taskId>'
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
