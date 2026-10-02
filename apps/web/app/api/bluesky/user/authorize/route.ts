import { NextRequest, NextResponse } from 'next/server';
import { getBlueskyClient } from '@/lib/bluesky/bluesky-client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const redirectTo = searchParams.get('redirectTo');
  const returnTo = searchParams.get('returnTo') ?? '/';

  try {
    if (!handle) {
      console.warn('Bluesky authorization failed - missing handle');
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    console.info('Bluesky authorization started', {
      handle,
      redirectTo,
      returnTo
    });

    const client = await getBlueskyClient();

    // Generate authorization URL for the user's handle
    // The SDK will discover the user's PDS and create the appropriate OAuth URL
    const authUrl = await client.authorize(handle);

    console.info('Bluesky authorization URL generated', {
      handle,
      authUrlHost: new URL(authUrl).host
    });

    // Store redirectTo in a cookie so we can retrieve it after callback
    // since OAuth state is managed internally by the Bluesky client
    const response = NextResponse.redirect(authUrl);
    if (redirectTo) {
      response.cookies.set('bluesky_redirect', redirectTo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600 // 10 minutes
      });
    }

    return response;
  } catch (error) {
    console.error('Bluesky authorization failed:', error);
    const url = new URL(
      returnTo,
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL
    );
    url.searchParams.set('error', 'bluesky_auth_failed');
    return NextResponse.redirect(url.toString());
  }
}
