import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTweet } from '@/lib/scrapebadger/procedures/get-tweet';
import { fetchAllRetweetersForTweet } from '@/lib/scrapebadger/procedures/get-retweeters';
import {
  extractTweetId,
  toTwitterPickerUsers,
  toTwitterPost
} from '@/lib/scrapebadger/utils';
import {
  getDisqualificationReason,
  selectRandomUnique
} from '@/lib/pickers-v2/twitter-v2/utils/picker-utils';
import { createId } from '@paralleldrive/cuid2';
import { pickerRatelimit, pickerHourlyRatelimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    const [perMinute, perHour] = await Promise.all([
      pickerRatelimit.limit(ip),
      pickerHourlyRatelimit.limit(ip)
    ]);

    if (!perMinute.success || !perHour.success) {
      const reset = !perMinute.success ? perMinute.reset : perHour.reset;

      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait before trying again.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000))
          }
        }
      );
    }

    const startTime = Date.now();
    const body = await request.json();
    const { postUrl, winnersCount, filters } = body;

    const tweetId = extractTweetId(postUrl);
    if (!tweetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid X post URL' },
        { status: 400 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existingPicker = await prisma.twitterPicker.findFirst({
      where: {
        tweetUrls: {
          has: postUrl
        },
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        users: true,
        tweets: true
      }
    });

    let tweet;
    let users;
    let pickerId;
    let shouldCreatePicker = !existingPicker;

    if (existingPicker) {
      pickerId = existingPicker.id;
      tweet = existingPicker.tweets[0];
      users = existingPicker.users.map((u) => ({
        id: u.userId,
        username: u.username,
        name: u.name,
        description: u.description,
        url: u.url,
        location: u.location,
        profile_image_url: u.profileImageUrl,
        profile_banner_url: u.bannerImageUrl,
        created_at: u.createdAt?.toISOString(),
        can_dm: u.canDm,
        followers_count: u.followersCount,
        following_count: u.followingCount,
        tweet_count: u.tweetCount,
        verified: u.verified
      }));
    } else {
      tweet = await getTweet({ tweetId });
      const fetchedUsers = await fetchAllRetweetersForTweet({
        tweetId,
        maxUsers: 50
      });
      users = fetchedUsers.users;
      pickerId = createId();
    }

    if (users.length === 0) {
      throw new Error('No retweeters found for this post');
    }

    const pickerData = shouldCreatePicker
      ? {
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
        }
      : null;

    const twitterPostData = shouldCreatePicker
      ? toTwitterPost({ pickerId, tweet })
      : null;
    const twitterPickerUsersData = shouldCreatePicker
      ? toTwitterPickerUsers({
          pickerId,
          users
        }).map((user) => ({
          ...user,
          id: createId()
        }))
      : existingPicker!.users;

    const eligibleUsers = twitterPickerUsersData.filter((user) => {
      return !getDisqualificationReason(user, existingPicker || pickerData!);
    });

    if (eligibleUsers.length === 0) {
      throw new Error(
        'No users match the specified filters. Try adjusting your requirements.'
      );
    }

    const selectedWinners = selectRandomUnique(
      eligibleUsers,
      Math.min(winnersCount, eligibleUsers.length)
    );

    const drawsData = selectedWinners.map((user) => ({
      id: createId(),
      pickerId,
      userId: user.id
    }));

    // Ensure minimum random delay between 3–10 seconds
    const minDelay = (3 + Math.random() * 7) * 1000;
    const delayPromise = new Promise((resolve) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(resolve, remaining);
    });

    const workPromise = prisma.$transaction(async (tx) => {
      if (shouldCreatePicker) {
        await tx.twitterPicker.create({
          data: pickerData!
        });

        await tx.twitterPost.create({
          data: twitterPostData!
        });

        await tx.twitterPickerUser.createMany({
          data: twitterPickerUsersData,
          skipDuplicates: true
        });
      } else {
        // Delete existing draws before creating new ones
        await tx.twitterPickerDraw.deleteMany({
          where: { pickerId }
        });

        // Update picker timestamp when re-rolling
        await tx.twitterPicker.update({
          where: { id: pickerId },
          data: {
            updatedAt: new Date()
          }
        });
      }

      await tx.twitterPickerDraw.createMany({
        data: drawsData
      });

      return {
        pickerId,
        tweet,
        winners: selectedWinners
      };
    });

    const [result] = await Promise.all([workPromise, delayPromise]);

    return NextResponse.json({
      success: true,
      data: {
        drawId: result.pickerId,
        postId: tweetId,
        winners: result.winners.map((user) => ({
          id: user.userId,
          username: user.username || 'unknown',
          name: user.name || 'Unknown User',
          profileImageUrl:
            user.profileImageUrl || `https://avatar.vercel.sh/${user.username}`,
          profileUrl: `https://x.com/${user.username}`
        })),
        postAuthor: {
          username: result.tweet.username || 'TheGiveawayDog',
          name: 'Giveaway Dog',
          profileUrl: `https://x.com/${result.tweet.username || 'TheGiveawayDog'}`
        }
      }
    });
  } catch (error) {
    console.error('Error picking winners:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to pick winners. Please try again.'
      },
      { status: 500 }
    );
  }
}
