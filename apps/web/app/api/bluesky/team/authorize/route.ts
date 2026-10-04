import { NextRequest, NextResponse } from 'next/server';
import { getTeamBlueskyClient } from '@giveaway/bluesky-api/bluesky/team-bluesky-client';
import { ApplicationError } from '@giveaway/util-errors';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const slug = searchParams.get('slug');
  const scope = searchParams.get('scope');
  const returnTo = searchParams.get('returnTo') ?? '/';

  try {
    if (!slug) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Slug parameter is required'
      });
    }

    if (!scope) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Scope parameter is required'
      });
    }

    if (!handle) {
      console.warn('Bluesky team authorization failed - missing handle');
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    console.info('Bluesky team authorization started', {
      handle,
      slug,
      scope,
      returnTo
    });

    const client = await getTeamBlueskyClient();

    // Generate authorization URL for the team's Bluesky integration
    // The SDK will discover the user's PDS and create the appropriate OAuth URL
    const authUrl = await client.authorize(handle, {
      scope: 'atproto transition:generic'
    });

    console.info('Bluesky team authorization URL generated', {
      handle,
      authUrlHost: new URL(authUrl).host
    });

    // Store team context in cookies so we can retrieve it after callback
    // since OAuth state is managed internally by the Bluesky client
    const response = NextResponse.redirect(authUrl);

    response.cookies.set('bluesky_team_slug', slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    response.cookies.set('bluesky_team_scope', scope, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Bluesky team authorization failed:', error);
    const url = new URL(
      returnTo,
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL
    );
    url.searchParams.set('error', 'bluesky_auth_failed');
    return NextResponse.redirect(url.toString());
  }
}
