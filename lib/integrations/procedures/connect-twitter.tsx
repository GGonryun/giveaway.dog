'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';
import { findUserTeamQuery } from '@/procedures/sweepstakes/shared';
import { datetime } from '@/lib/date';
import {
  TWITTER_TEAM_APP_CLIENT_ID,
  TWITTER_REDIRECT_URI,
  TwitterStateSchema
} from '../schemas';
import {
  getScopesForTwitterFeatures,
  twitterFeatureSchema,
  type TwitterFeatureSchema
} from '../scopes';

export const connectTwitter = procedure()
  .authorization({
    required: true
  })
  .input(
    z.object({
      slug: z.string(),
      features: z.array(twitterFeatureSchema).min(1)
    })
  )
  .output(
    z.object({
      authUrl: z.string().url()
    })
  )
  .handler(async ({ input, user, db }) => {
    const team = await db.team.findUnique({
      where: findUserTeamQuery({ slug: input.slug, userId: user.id })
    });

    if (!team) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    }

    if (!TWITTER_TEAM_APP_CLIENT_ID || !TWITTER_REDIRECT_URI) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Twitter OAuth not configured'
      });
    }

    const { codeVerifier, codeChallenge } = generateCodeChallenge();

    const scopes = getScopesForTwitterFeatures(
      input.features as TwitterFeatureSchema[]
    );
    const scopeString = scopes.join(' ');

    const value: TwitterStateSchema = {
      teamId: team.id,
      codeVerifier
    };

    const state = await db.state.create({
      data: { value, expiresAt: datetime.minutesFromNow(10) },
      select: { id: true }
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: TWITTER_TEAM_APP_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      scope: scopeString,
      state: `${team.slug}:${state.id}`,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

    return {
      authUrl
    };
  });

function generateCodeChallenge(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const crypto = require('crypto');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}
