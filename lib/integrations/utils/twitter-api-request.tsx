'use server';

import { ApplicationError } from '@/lib/errors';
import { getLatestTwitterAccessToken } from './get-latest-twitter-access-token';
import { Tx } from '@/lib/prisma';
import { z } from 'zod';

interface TwitterApiRequestOptions<T> {
  tx: Tx;
  teamId: string;
  endpoint: string;
  params?: URLSearchParams;
  responseSchema: z.ZodSchema<T>;
}

export async function twitterApiRequest<T>({
  tx,
  teamId,
  endpoint,
  params,
  responseSchema
}: TwitterApiRequestOptions<T>): Promise<T> {
  const { access_token } = await getLatestTwitterAccessToken(tx, { teamId });

  const url = params ? `${endpoint}?${params.toString()}` : endpoint;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset');
      const retryAfter = resetTime
        ? new Date(parseInt(resetTime) * 1000)
        : new Date(Date.now() + 15 * 60 * 1000);

      throw new ApplicationError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Twitter API rate limit exceeded',
        data: {
          retryAfter: retryAfter.getTime(),
          retryAfterISO: retryAfter.toISOString()
        },
        cause: JSON.stringify(error)
      });
    }

    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Failed to fetch data from Twitter API',
      cause: JSON.stringify(error)
    });
  }

  const data = await response.json();
  const parsed = responseSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid response format from Twitter',
      cause: parsed.error
    });
  }

  return parsed.data;
}
