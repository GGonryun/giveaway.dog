import { NextRequest, NextResponse } from 'next/server';
import prisma from '@giveaway/db-client/prisma';
import {
  extractTweetId,
  toTwitterPickerUsers,
  toTwitterPost
} from '@giveaway/x-scraper/utils';
import {
  getDisqualificationReason,
  selectRandomUnique
} from '@giveaway/x-picker-model/picker-utils';
import { createId } from '@paralleldrive/cuid2';
import { fetchRetweetersWithCoverage } from '@giveaway/x-picker-server/fetch-retweeters-with-coverage';
import { ApplicationError } from '@giveaway/util-errors';
import { checkAndConsumeCredits } from '@giveaway/x-scraper/credits';
import { CREDIT_COSTS } from '@giveaway/x-scraper/settings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postUrl, winnersCount, filters } = body;

    const tweetId = extractTweetId(postUrl);
    if (!tweetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid X post URL' },
        { status: 400 }
      );
    }

    // Charge credits upfront for this endpoint call
    await checkAndConsumeCredits(
      request.headers,
      CREDIT_COSTS.PICK_WINNERS_ENDPOINT
    );

    // Fetch tweet and retweeters (uses Redis cache)
    const result = await fetchRetweetersWithCoverage(tweetId);
    const { tweet, users } = result;

    if (users.length === 0) {
      throw new Error('No retweeters found for this post');
    }

    // Always create a new picker
    const pickerId = createId();

    const pickerData = {
      id: pickerId,
      tweetUrls: [postUrl],
      winners: winnersCount,
      minPostCount: filters.minimumPostCount,
      minAccountAgeDays: filters.minimumAccountAgeDays,
      minFollowersCount: filters.minimumFollowers,
      minFollowingCount: filters.minimumFollowing,
      requireProfileImage: filters.hasProfileImage,
      requireBannerImage: filters.hasBanner,
      requireLocation: filters.hasLocation,
      requireBio: filters.hasDescription,
      lastPostWithin: filters.lastPostWithin,
      status: 'COMPLETE' as const
    };

    const twitterPostData = toTwitterPost({ pickerId, tweet });
    const twitterPickerUsersData = toTwitterPickerUsers({
      pickerId,
      users
    }).map((user) => ({
      ...user,
      id: createId()
    }));

    const eligibleUsers = twitterPickerUsersData.filter((user) => {
      return !getDisqualificationReason(user, pickerData);
    });

    if (eligibleUsers.length < winnersCount) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Not enough eligible entries. Only ${eligibleUsers.length} of ${users.length} users passed your filters, but you requested ${winnersCount} winners. Try relaxing your filter requirements.`
      });
    }

    const selectedWinners = selectRandomUnique(eligibleUsers, winnersCount);

    const drawsData = selectedWinners.map((user) => ({
      id: createId(),
      pickerId,
      userId: user.id
    }));

    // Create picker, post, users, and draws in a single transaction
    await prisma.$transaction([
      prisma.twitterPicker.create({
        data: pickerData
      }),
      prisma.twitterPost.create({
        data: twitterPostData
      }),
      prisma.twitterPickerUser.createMany({
        data: twitterPickerUsersData,
        skipDuplicates: true
      }),
      prisma.twitterPickerDraw.createMany({
        data: drawsData
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        drawId: pickerId,
        postId: tweetId,
        winners: selectedWinners.map((user) => ({
          id: user.userId,
          username: user.username || 'unknown',
          name: user.name || 'Unknown User',
          profileImageUrl:
            user.profileImageUrl || `https://avatar.vercel.sh/${user.username}`,
          profileUrl: `https://x.com/${user.username}`
        })),
        postAuthor: {
          username: tweet.username || 'TheGiveawayDog',
          name: 'Giveaway Dog',
          profileUrl: `https://x.com/${tweet.username || 'TheGiveawayDog'}`
        }
      }
    });
  } catch (error) {
    console.error('[pick-winners] Error picking winners:', error);
    return ApplicationError.toResponse(error);
  }
}
