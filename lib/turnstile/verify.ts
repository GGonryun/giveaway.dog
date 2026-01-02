'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { verifyTurnstileToken } from './server';
import { setTurnstileToken } from './cookies';

const verifyTurnstile = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      token: z.string()
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      verified: z.boolean()
    })
  )
  .handler(async ({ db, user, input: { token } }) => {
    const verificationResult = await verifyTurnstileToken(token);

    if (verificationResult.success && token !== 'failed') {
      await setTurnstileToken(token);
    }

    if (user?.id) {
      await db.userTurnstile.upsert({
        where: { userId: user.id },
        update: {
          token: token === 'failed' ? null : token,
          success: verificationResult.success,
          score: verificationResult.score,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          token: token === 'failed' ? null : token,
          success: verificationResult.success,
          score: verificationResult.score
        }
      });

      await db.userScoringRequest.upsert({
        where: { userId: user.id },
        update: { updatedAt: new Date() },
        create: { userId: user.id }
      });
    }

    return {
      success: verificationResult.success,
      verified: true
    };
  });

export default verifyTurnstile;
