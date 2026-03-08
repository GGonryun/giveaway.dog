import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTweet } from '@/lib/scrapebadger/procedures/get-tweet';
import { getUser } from '@/lib/scrapebadger/procedures/get-user';

const loadTweetSchema = z.object({
  postUrl: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      (url) =>
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('t.co'),
      {
        message: 'Please enter a valid X (Twitter) post URL'
      }
    )
});

function extractTweetId(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /t\.co\/(\w+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postUrl } = loadTweetSchema.parse(body);

    const tweetId = extractTweetId(postUrl);
    if (!tweetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract tweet ID from URL'
        },
        { status: 400 }
      );
    }

    const tweet = await getTweet({ tweetId });

    const user = await getUser({ username: tweet.username });

    console.log('[load-tweet] Loaded tweet:', tweet, user);

    return NextResponse.json({
      success: true,
      data: {
        id: tweet.id,
        text: tweet.text,
        username: tweet.username,
        profileImageUrl: user.profileImageUrl,
        isBlueVerified: user.is_blue_verified,
        media: tweet.media?.map((m: { url: string; altText?: string }) => ({
          url: m.url,
          altText: m.altText
        })),
        replyCount: tweet.replyCount,
        retweetCount: tweet.retweetCount,
        favoriteCount: tweet.favoriteCount,
        viewCount: tweet.viewCount,
        createdAt: tweet.createdAt
      }
    });
  } catch (error) {
    console.error('[load-tweet] Error loading tweet:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid request'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load tweet. Please try again.'
      },
      { status: 500 }
    );
  }
}
