import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTeamBlueskyClient } from '@/lib/bluesky/team-bluesky-client';
import { ApplicationError } from '@giveaway/util-errors';
import { IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { Agent } from '@atproto/api';
import { auth } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');

  const userSession = await auth();
  if (!userSession?.user?.id) {
    throw new ApplicationError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  const slug = request.cookies.get('bluesky_team_slug')?.value;
  const scope = request.cookies.get('bluesky_team_scope')?.value;

  try {
    if (!slug) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Team context not found'
      });
    }

    if (!scope) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Bluesky scope not found'
      });
    }

    if (error) {
      const errorDescription = searchParams.get('error_description');
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Bluesky OAuth error',
        data: { error, errorDescription }
      });
    }

    const team = await prisma.team.findUnique({ where: { slug } });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    const owner = await prisma.user.findFirst({
      where: {
        id: userSession.user.id,
        teams: {
          some: {
            teamId: team.id
          }
        }
      },
      include: {
        teams: true
      }
    });

    if (!owner) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'User is not a member of the team'
      });
    }
    const client = await getTeamBlueskyClient();

    const { session: blueskySession } = await client.callback(searchParams);

    const agent = new Agent(blueskySession);
    const profileResponse = await agent.getProfile({
      actor: blueskySession.did
    });
    const profile = profileResponse.data;

    const accountId = blueskySession.did;
    const handle = profile.handle;
    const displayName = profile.displayName || handle;

    const existingIntegration = await prisma.integration.findFirst({
      where: {
        account_id: blueskySession.did,
        provider: IntegrationProvider.BLUESKY
      }
    });

    if (existingIntegration) {
      // check to see if the integration was connected to a different team
      if (
        existingIntegration.teamId &&
        existingIntegration.teamId !== team.id
      ) {
        throw new ApplicationError({
          code: 'FORBIDDEN',
          message:
            'Bluesky integration is already connected on a different team',
          cause: `Integration ID ${existingIntegration.id} is connected to team ID ${existingIntegration.teamId}`
        });
      }

      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          account_id: accountId,
          label: displayName,
          scope: scope,
          ownerId: userSession.user.id,
          teamId: team.id,
          status: IntegrationStatus.ACTIVE
        }
      });
    } else {
      // we should only get to this point if the integration was somehow deleted between the callback and this check
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Bluesky integration not found',
        cause: `No Bluesky integration found for account ID ${accountId}`
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
    const response = NextResponse.redirect(
      new URL(
        `/app/${team.slug}/settings/integrations?success=bluesky_connected&handle=${handle}`,
        baseUrl
      )
    );

    response.cookies.delete('bluesky_team_slug');
    response.cookies.delete('bluesky_team_scope');

    return response;
  } catch (error) {
    console.error('Bluesky OAuth callback error:', error);

    const errorMessage =
      error instanceof ApplicationError
        ? error.message
        : 'Failed to connect Bluesky';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
    return NextResponse.redirect(
      new URL(
        `/app/${slug}/settings/integrations?error=${encodeURIComponent(errorMessage)}`,
        baseUrl
      )
    );
  }
}
