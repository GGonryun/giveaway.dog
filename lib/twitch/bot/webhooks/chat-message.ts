import db from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { newVersionedRateLimiter } from '@/lib/ratelimit';
import { twitchChatMessageEventSchema } from './schema';
import { toTaskSchema } from '@/lib/task/schemas';
import { sendChatMessage } from '@/lib/twitch/api/send-chat-message';
import { TWITCH_BOT_USER_ID } from '@/lib/twitch/bot/scopes';
import { Task, Sweepstakes, SweepstakesTiming } from '@prisma/client';

const TASK_CACHE_TTL = 60 * 30; // 5 minutes
const USER_CACHE_TTL = 60 * 60 * 24 * 3; // 3 days

const getTaskCacheKey = (broadcasterId: string, trigger: string) =>
  `twitch:task:${broadcasterId}:${trigger.toLowerCase()}`;
const getUserCacheKey = (chatterId: string) => `twitch:user:${chatterId}`;

type TaskWithSweepstakes = Task & {
  sweepstakes: Sweepstakes & {
    timing: SweepstakesTiming | null;
  };
};

const extractTrigger = (text: string): string | undefined => {
  const words = text.trim().split(/\s+/);
  return words.find((word) => word.startsWith('!'));
};

const findOrCreateUser = async ({
  chatter_user_id,
  chatter_user_name,
  chatter_user_login
}: {
  chatter_user_id: string;
  chatter_user_name: string;
  chatter_user_login: string;
}) => {
  const cacheKey = getUserCacheKey(chatter_user_id);
  const cached = await redis.get<{ id: string; name: string | null }>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const user = await findOrCreateUserFromDb({
    chatter_user_id,
    chatter_user_name,
    chatter_user_login
  });
  await redis.set(
    cacheKey,
    { id: user.id, name: user.name },
    { ex: USER_CACHE_TTL }
  );
  return user;
};

const findOrCreateUserFromDb = async ({
  chatter_user_id,
  chatter_user_name,
  chatter_user_login
}: {
  chatter_user_id: string;
  chatter_user_name: string;
  chatter_user_login: string;
}) => {
  const existing = await db.user.findFirst({
    where: {
      accounts: {
        some: {
          provider: 'twitch',
          providerAccountId: chatter_user_id
        }
      }
    }
  });

  if (existing) {
    return existing;
  }

  return db.user.create({
    data: {
      name: chatter_user_name,
      source: 'TWITCH_IMPORT',
      accounts: {
        create: {
          type: 'oauth',
          provider: 'twitch',
          providerAccountId: chatter_user_id,
          access_token: null,
          refresh_token: null,
          expires_at: null,
          token_type: 'bearer',
          scope: '',
          id_token: null,
          session_state: null,
          label: chatter_user_login
        }
      }
    }
  });
};

const findMatchingTask = async (
  broadcasterId: string,
  trigger: string
): Promise<TaskWithSweepstakes | null> => {
  const cacheKey = getTaskCacheKey(broadcasterId, trigger);
  const cached = await redis.get<TaskWithSweepstakes | false>(cacheKey);
  if (cached !== null) {
    return cached === false ? null : cached;
  }

  const result = await findMatchingTaskFromDb(broadcasterId, trigger);
  await redis.set(cacheKey, result ?? false, { ex: TASK_CACHE_TTL });
  return result;
};

const findMatchingTaskFromDb = async (
  broadcasterId: string,
  trigger: string
): Promise<TaskWithSweepstakes | null> => {
  // Find the Twitch integration for this broadcaster
  const integration = await db.integration.findFirst({
    where: {
      provider: 'TWITCH',
      account_id: broadcasterId,
      status: 'ACTIVE'
    },
    select: {
      teamId: true
    }
  });

  if (!integration?.teamId) {
    console.info(
      `[Twitch] No active integration found for broadcaster ${broadcasterId}`
    );
    return null;
  }

  // Query all tasks for active sweepstakes in this team
  const tasks = await db.task.findMany({
    where: {
      sweepstakes: {
        teamId: integration.teamId,
        status: 'ACTIVE'
      }
    },
    include: {
      sweepstakes: {
        include: {
          timing: true
        }
      }
    }
  });

  if (tasks.length === 0) {
    return null;
  }

  // Find a matching TWITCH_CHAT_IMPORT task
  for (const task of tasks) {
    try {
      const config = toTaskSchema(task);

      // Check if it's a TWITCH_CHAT_IMPORT task
      if (config.type !== 'TWITCH_CHAT_IMPORT') {
        continue;
      }

      // Check if the trigger matches this task's trigger
      if (trigger.toLowerCase() !== config.trigger.toLowerCase()) {
        continue;
      }

      // Check if sweepstakes has expired
      const endDate = task.sweepstakes.timing?.endDate;
      if (endDate && new Date(endDate) < new Date()) {
        console.info(
          `[Twitch] Task ${task.id} has expired (end date: ${endDate})`
        );
        continue;
      }

      return task as TaskWithSweepstakes;
    } catch (error) {
      // Skip tasks that can't be parsed
      console.warn(`[Twitch] Failed to parse task ${task.id}:`, error);
      continue;
    }
  }

  console.info(`[Twitch] No valid task found for trigger: ${trigger}`);
  return null;
};

export const processChatMessage = async (event: unknown) => {
  const data = twitchChatMessageEventSchema.parse(event);
  console.info('Processing Twitch chat message event:', data);
  const {
    broadcaster_user_id,
    chatter_user_id,
    chatter_user_login,
    chatter_user_name,
    message,
    message_id
  } = data;

  if (chatter_user_id === TWITCH_BOT_USER_ID) {
    return;
  }

  const trigger = extractTrigger(message.text);

  if (!trigger) {
    return;
  }

  // Find matching task for the broadcaster and trigger
  const matchedTask = await findMatchingTask(broadcaster_user_id, trigger);

  if (!matchedTask) {
    return;
  }

  const config = toTaskSchema(matchedTask);
  if (config.type !== 'TWITCH_CHAT_IMPORT') {
    return;
  }
  const rateLimit = config.rateLimit ?? null;
  const taskId = matchedTask.id;
  const sweepstakesId = matchedTask.sweepstakesId;

  // Find or create user
  const user = await findOrCreateUser({
    chatter_user_id,
    chatter_user_name,
    chatter_user_login
  });

  if (rateLimit) {
    const limiter = newVersionedRateLimiter({
      prefix: `twitch:entry:${taskId}`,
      max: rateLimit.max,
      window: rateLimit.window
    });
    const { success } = await limiter.limit(user.id);
    if (!success) {
      console.info(
        `[Twitch] Rate limit exceeded for user ${user.id} on task ${taskId}`
      );
      await sendChatMessage(
        broadcaster_user_id,
        `@${chatter_user_login} Try again later!`
      );
      return;
    }
  } else {
    const existingCompletion = await db.taskCompletion.findFirst({
      where: {
        taskId,
        participant: {
          userId: user.id,
          sweepstakesId
        }
      }
    });

    if (existingCompletion) {
      console.info(
        `[Twitch] Task completion already exists for user ${user.id} and task ${taskId}`
      );
      await sendChatMessage(
        broadcaster_user_id,
        `@${chatter_user_login} You are already entered in this giveaway!`
      );
      return;
    }
  }

  // Create task completion with participant using connectOrCreate
  try {
    await db.taskCompletion.create({
      data: {
        participant: {
          connectOrCreate: {
            where: {
              userId_sweepstakesId: {
                userId: user.id,
                sweepstakesId
              }
            },
            create: {
              userId: user.id,
              sweepstakesId
            }
          }
        },
        task: {
          connect: { id: taskId }
        },
        status: 'COMPLETED',
        proof: {
          source: 'twitch_chat',
          twitchUserId: chatter_user_id,
          twitchUsername: chatter_user_login,
          broadcasterId: broadcaster_user_id,
          messageId: message_id,
          timestamp: new Date().toISOString()
        }
      }
    });

    await db.userScoringRequest.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: { updatedAt: new Date() }
    });

    console.info(
      `[Twitch] Successfully completed task ${taskId} for user ${user.id} in sweepstakes ${sweepstakesId}`
    );
    await sendChatMessage(
      broadcaster_user_id,
      `@${chatter_user_login} You have been added to the giveaway!`
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.info(
        `[Twitch] Task completion already exists for user ${user.id} and task ${taskId}`
      );
      await sendChatMessage(
        broadcaster_user_id,
        `@${chatter_user_login} You are already entered in this giveaway!`
      );
      return;
    }
    if (error.code === 'P2003') {
      await redis.del(getUserCacheKey(chatter_user_id));
      console.info(
        `[Twitch] Stale user cache cleared for ${chatter_user_id}, will retry on next message`
      );
      await sendChatMessage(
        broadcaster_user_id,
        `@${chatter_user_login} We need to update your user profile, please try again!`
      );
      return;
    }
    throw error;
  }
};
