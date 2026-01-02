'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';

const verifyTurnstile = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      token: z.string(),
      sweepstakesId: z.string()
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

    await db.userTurnstile.create({
      data: {
        userId: user.id,
        token: token === 'failed' ? null : token,
        success: verificationResult.success
      }
    });

    await db.userScoringRequest.upsert({
      where: { userId: user.id },
      update: { updatedAt: new Date() },
      create: { userId: user.id }
    });

    return {
      success: verificationResult.success,
      verified: true
    };
  });

export default verifyTurnstile;
