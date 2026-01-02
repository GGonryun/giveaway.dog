'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';

export const getLastTurnstileCheck = procedure()
  .authorization({
    required: false
  })
  .input(z.object({}))
  .output(z.date().optional())
  .handler(async ({ db, user }) => {
    if (!user?.id) return undefined;

    const lastSuccessfulVerification = await db.userTurnstile.findFirst({
      where: {
        userId: user.id,
        success: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    });

    return lastSuccessfulVerification?.createdAt ?? undefined;
  });
