'use server';

import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';
import { twitterV2PickerFormSchema } from '../schemas/form';
import { ApplicationError } from '@/lib/errors';
import {
  extractTweetId,
  extractUsernameFromTweetUrl
} from '@/lib/integrations/schemas/twitter';
import { getTweet } from '@/lib/scrapebadger/procedures/get-tweet';
import { findUserTeam } from '@/procedures/sweepstakes/shared';
import { TeamPermission } from '@/lib/permissions';

export const updateTwitterV2Picker = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      pickerId: z.string(),
      slug: z.string(),
      data: twitterV2PickerFormSchema({ validateTiming: false })
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ db, input, user }) => {
    const { pickerId, data, slug } = input;

    const { team } = await findUserTeam({
      db,
      user,
      slug,
      permission: TeamPermission.UPDATE_PICKERS
    });

    const picker = await db.twitterPicker.findUnique({
      where: { id: pickerId }
    });

    if (!picker) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Picker not found'
      });
    }

    if (picker.teamId !== team.id) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this picker'
      });
    }

    for (const { url: postUrl } of data.setup.postUrls) {
      const extractedTweetId = extractTweetId(postUrl);
      const username = extractUsernameFromTweetUrl(postUrl);

      if (!extractedTweetId || extractedTweetId === postUrl) {
        continue;
      }

      try {
        const tweetData = await getTweet({ tweetId: extractedTweetId });

        const existingPost = await db.twitterPost.findFirst({
          where: { tweetId: extractedTweetId, pickerId }
        });

        const postData = {
          text: tweetData.text || null,
          userId: tweetData.user_id || null,
          username: username || tweetData.username || null,
          favoriteCount: tweetData.favorite_count || null,
          retweetCount: tweetData.retweet_count || null,
          replyCount: tweetData.reply_count || null,
          viewCount: tweetData.view_count || null,
          quoteCount: tweetData.quote_count || null,
          conversationId: tweetData.conversation_id || null,
          inReplyToUserId: tweetData.in_reply_to_user_id || null,
          isQuoteStatus: tweetData.is_quote_status || null,
          lang: tweetData.lang || null
        };

        if (existingPost) {
          await db.twitterPost.update({
            where: { id: existingPost.id },
            data: postData
          });
        } else {
          await db.twitterPost.create({
            data: {
              tweetId: extractedTweetId,
              pickerId,
              ...postData
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching tweet data for ${postUrl}:`, error);
      }
    }

    await db.twitterPicker.update({
      where: { id: pickerId },
      data: {
        tweetUrls: data.setup.postUrls.map((item) => item.url),
        winners: data.winners.quota,
        minPostCount: data.filters.minimumPostCount,
        minAccountAgeDays: data.filters.minimumAccountAgeDays,
        minFollowersCount: data.filters.minimumFollowers,
        minFollowingCount: data.filters.minimumFollowing,
        requireProfileImage: data.filters.hasProfileImage,
        requireBannerImage: data.filters.hasBanner,
        requireLocation: data.filters.hasLocation,
        requireBio: data.filters.hasDescription,
        lastPostWithin: data.filters.lastPostWithin,
        runAt: data.timing?.runAt ? new Date(data.timing.runAt) : null
      }
    });

    return { success: true };
  });
