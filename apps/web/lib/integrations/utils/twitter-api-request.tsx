'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { getLatestTwitterAccessToken } from './get-latest-twitter-access-token';
import { Tx } from '@giveaway/db-client/prisma';
import { z } from 'zod';

interface TwitterApiRequestOptions<T> {
  tx: Tx;
  teamId: string;
  integrationId?: string;
  endpoint: string;
  method?: 'GET' | 'POST';
  params?: URLSearchParams;
  body?: unknown;
  formData?: FormData;
  responseSchema: z.ZodSchema<T>;
}

export async function twitterApiRequest<T>({
  tx,
  teamId,
  integrationId,
  endpoint,
  method = 'GET',
  params,
  body,
  formData,
  responseSchema
}: TwitterApiRequestOptions<T>): Promise<T> {
  const { access_token } = await getLatestTwitterAccessToken(tx, {
    teamId,
    integrationId
  });

  const url = params ? `${endpoint}?${params.toString()}` : endpoint;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${access_token}`
  };

  if (!formData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    console.warn(`Twitter API Error: ${url} - Status: ${response.status}`);

    if (response.status === 429) {
      const error = await response.clone().json();
      const resetTime = response.headers.get('x-rate-limit-reset');
      const rateLimit = response.headers.get('x-rate-limit-limit');
      const rateLimitRemaining = response.headers.get('x-rate-limit-remaining');

      const retryAfter = resetTime
        ? new Date(parseInt(resetTime) * 1000)
        : new Date(Date.now() + 15 * 60 * 1000);

      console.warn('[twitterApiRequest] Rate limit details:', {
        resetTime: resetTime ? new Date(parseInt(resetTime) * 1000) : null,
        rateLimit,
        rateLimitRemaining,
        retryAfter: retryAfter.toISOString(),
        error
      });

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

    const errorText = await response.clone().text();
    console.error('[twitterApiRequest] Error response:', errorText);

    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Failed to fetch data from Twitter API',
      cause: errorText
    });
  }

  const data = await response.json();

  const parsed = responseSchema.safeParse(data);

  if (!parsed.success) {
    console.error(
      '[twitterApiRequest] Schema validation failed:',
      parsed.error
    );
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'Invalid response format from Twitter',
      cause: parsed.error
    });
  }

  return parsed.data;
}
