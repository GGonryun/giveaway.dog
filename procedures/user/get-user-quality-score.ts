import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { toUserQuality, userQualitySchema } from '@/schemas/user-scoring';
import { z } from 'zod';

const getUserQualityScore = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      userId: z.string()
    })
  )
  .output(userQualitySchema)
  .handler(async ({ input, db }) => {
    const userQuality = await db.userQuality.findFirst({
      where: {
        userId: input.userId
      },
      orderBy: {
        // Get the most recent quality score
        createdAt: 'desc'
      }
    });

    if (!userQuality) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User quality score not found'
      });
    }

    console.info('User quality score found:', userQuality);

    return toUserQuality(userQuality);
  });

export default getUserQualityScore;
