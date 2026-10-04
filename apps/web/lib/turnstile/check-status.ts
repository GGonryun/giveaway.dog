'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { cookies } from 'next/headers';
import {
  TURNSTILE_COOKIE_NAME,
  TURNSTILE_DB_DAYS
} from '@giveaway/turnstile-model/consts';
import { verifyTurnstileToken } from './server';
import { turnstileStatusSchema } from '@giveaway/turnstile-model/schemas';

export const getLastTurnstileCheck = procedure()
  .authorization({
    required: false
  })
  .input(z.object({}))
  .output(turnstileStatusSchema.optional())
  .handler(async ({ db, user }) => {
    // Always check database first for authenticated users (valid for 7 days)
    if (user?.id) {
      const lastVerification = await db.userTurnstile.findUnique({
        where: { userId: user.id },
        select: {
          token: true,
          score: true,
          success: true,
          updatedAt: true
        }
      });

      // Check if verification is still valid (within 7 days) and successful
      if (
        lastVerification &&
        lastVerification.success &&
        lastVerification.token &&
        lastVerification.updatedAt >=
          new Date(Date.now() - TURNSTILE_DB_DAYS * 24 * 60 * 60 * 1000)
      ) {
        return {
          token: lastVerification.token,
          score: lastVerification.score,
          lastCheckedAt: lastVerification.updatedAt
        };
      }
    }

    // If no DB entry, check cookie and verify it
    const cookieStore = await cookies();
    const cookie = cookieStore.get(TURNSTILE_COOKIE_NAME);

    if (cookie?.value) {
      // Verify the cookie token with Cloudflare
      const verificationResult = await verifyTurnstileToken(cookie.value);

      if (verificationResult.success) {
        return {
          token: cookie.value,
          score: verificationResult.confidence ?? null,
          lastCheckedAt: new Date()
        };
      }
    }

    return undefined;
  });
