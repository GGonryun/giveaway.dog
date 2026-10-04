import { NextRequest, NextResponse } from 'next/server';
import prisma from '@giveaway/db-client/prisma';
import z from 'zod';

import { twitterOAuthCallback } from '@/lib/integrations/procedures/twitter-oauth-callback';
import { twitterStateSchema } from '@giveaway/integration-model/schemas';
import { ApplicationError } from '@giveaway/util-errors';

const twitterCallbackResultSchema = z.object({
  success: z.literal(true),
  username: z.string()
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const rawState = searchParams.get('state');
  const error = searchParams.get('error');

  if (!rawState) {
    console.error('Missing state parameter in Twitter callback');
    return NextResponse.redirect(new URL('/404', request.url));
  }

  const [slug, stateId] = rawState.split(':');
  const basePath = `/app/${slug}/settings/integrations`;

  try {
    const state = await prisma.state.findUnique({
      where: { id: stateId }
    });

    if (!state) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'State not found',
        data: 'invalid_state'
      });
    }

    if (!state.expiresAt) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'State has no expiration',
        data: 'invalid_state'
      });
    }

    if (state.expiresAt < new Date()) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'State has expired',
        data: 'expired_state'
      });
    }

    if (error) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Twitter OAuth error',
        data: error
      });
    }

    if (!code || !rawState) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Missing code or state',
        data: 'missing_code'
      });
    }

    const parsed = twitterStateSchema.safeParse(state.value);
    if (!parsed.success) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Failed to parse state',
        data: 'parse_error',
        cause: parsed.error
      });
    }

    const result = await twitterOAuthCallback({
      code,
      state: parsed.data
    });

    if (!result.ok) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Twitter OAuth callback failed',
        data: 'oauth_failed'
      });
    }

    const validatedResult = twitterCallbackResultSchema.safeParse(result.data);
    if (!validatedResult.success) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid callback result format',
        data: 'validation_error',
        cause: validatedResult.error
      });
    }

    const { username } = validatedResult.data;

    return NextResponse.redirect(
      new URL(
        `/app/${slug}/settings/integrations?success=twitter_connected&username=${username}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);

    const newParams = new URLSearchParams();

    if (
      error instanceof ApplicationError &&
      error.code === 'BAD_REQUEST' &&
      error.data &&
      typeof error.data === 'string'
    ) {
      try {
        await prisma.state.delete({ where: { id: stateId } });
      } catch (error) {
        console.error('Failed to delete state:', error);
      } finally {
        newParams.set('error', error.data);
        return NextResponse.redirect(
          new URL(`${basePath}?${newParams.toString()}`, request.url)
        );
      }
    }

    newParams.set('error', 'internal_server_error');
    return NextResponse.redirect(
      new URL(`${basePath}?${newParams.toString()}`, request.url)
    );
  }
}
