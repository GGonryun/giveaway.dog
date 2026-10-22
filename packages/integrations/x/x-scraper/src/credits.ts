import 'server-only';

import { scrapeBadgerCredits } from './ratelimit';
import { ApplicationError } from '@giveaway/util-errors';
import { verifyE2eSecret } from '@giveaway/e2e-gate/gate';
import {
  E2E_CREDITS_POOL_COOKIE,
  E2E_CREDITS_SECRET_COOKIE,
  e2eCreditPoolSchema
} from '@giveaway/e2e-model/credits';

const readCookie = (headers: Headers, name: string) => {
  const prefix = `${name}=`;
  return (headers.get('cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
};

const toE2eIdentifier = (headers: Headers) => {
  if (!verifyE2eSecret(readCookie(headers, E2E_CREDITS_SECRET_COOKIE))) {
    return undefined;
  }
  const pool = e2eCreditPoolSchema.safeParse(
    readCookie(headers, E2E_CREDITS_POOL_COOKIE)
  );
  return pool.success ? `e2e:${pool.data}` : undefined;
};

const toIpIdentifier = (headers: Headers) => {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown';
  return `ip:${ip}`;
};

export async function checkAndConsumeCredits(
  headers: Headers,
  cost: number
): Promise<void> {
  const identifier = toE2eIdentifier(headers) ?? toIpIdentifier(headers);

  const result = await scrapeBadgerCredits.limit(identifier, {
    rate: cost
  });

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    throw new ApplicationError({
      code: 'TOO_MANY_REQUESTS',
      message: `Insufficient credits. Need ${cost}, have ${result.remaining}. Resets in ${retryAfterSeconds} seconds.`,
      data: {
        creditsNeeded: cost,
        creditsRemaining: result.remaining,
        retryAfter: result.reset,
        retryAfterISO: new Date(result.reset).toISOString()
      }
    });
  }
}
