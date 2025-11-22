'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';
import { findUserSweepstakes } from './shared';
import { importTwitterParticipantsAsSweepstakes } from '@/lib/sweepstakes/twitter-import';
import { getLikingUsers } from '@/lib/integrations/procedures/get-liking-users';
import { extractTweetId } from '@/lib/integrations/schemas/twitter';
import type { TwitterUser } from '@/lib/integrations/schemas/api';

const MAX_IMPORT_USERS = 10000; // Safety limit
const TWITTER_API_PAGE_SIZE = 100;

const importTwitterLikes = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      sweepstakesId: z.string(),
      slug: z.string(),
      taskId: z.string(),
      postUrl: z
        .string()
        .url('Please enter a valid Twitter/X post URL')
        .refine(
          (val) => {
            const urlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//;
            return urlPattern.test(val);
          },
          { message: 'URL must be a Twitter/X post' }
        )
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      imported: z.number(),
      existing: z.number(),
      entries: z.number(),
      totalFetched: z.number(),
      errors: z.array(
        z.object({
          twitterUserId: z.string(),
          error: z.string()
        })
      )
    })
  )
  .handler(async ({ input, db, user }) => {
    // Verify user owns the sweepstakes
    const sweepstakes = await findUserSweepstakes({
      db,
      user,
      id: input.sweepstakesId
    });

    // Verify task belongs to this sweepstakes
    const task = await db.task.findFirst({
      where: {
        id: input.taskId,
        sweepstakesId: input.sweepstakesId
      }
    });

    if (!task) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Task not found in this sweepstakes'
      });
    }

    // Extract tweet ID from URL
    const tweetId = extractTweetId(input.postUrl);

    // Fetch all liking users from Twitter API (with pagination)
    const allTwitterUsers: TwitterUser[] = [];
    let paginationToken: string | undefined;

    do {
      const response = await getLikingUsers(db, {
        tweetId,
        maxResults: TWITTER_API_PAGE_SIZE,
        teamId: sweepstakes.team.id,
        paginationToken
      });

      if (response.data) {
        allTwitterUsers.push(...response.data);
      }

      paginationToken = response.meta?.next_token;

      // Safety check to prevent infinite loops or excessive imports
      if (allTwitterUsers.length >= MAX_IMPORT_USERS) {
        console.warn(
          `[import-twitter-likes] Reached max import limit of ${MAX_IMPORT_USERS} users`
        );
        break;
      }
    } while (paginationToken);

    if (allTwitterUsers.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'No liking users found for this post'
      });
    }

    // Import users as sweepstakes participants
    const result = await importTwitterParticipantsAsSweepstakes(db, {
      sweepstakesId: input.sweepstakesId,
      taskId: input.taskId,
      twitterUsers: allTwitterUsers
    });

    return {
      success: true,
      imported: result.imported,
      existing: result.existing,
      entries: result.entries,
      totalFetched: allTwitterUsers.length,
      errors: result.errors
    };
  });

export default importTwitterLikes;
