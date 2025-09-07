import { procedure } from '@/lib/mrpc/procedures';
import { userParticipationSchema } from '@/schemas/giveaway/schemas';
import z from 'zod';

const getUserSweepstakesParticipation = procedure
  .authorization({ required: false })
  .input(z.object({ id: z.string() }))
  .output(userParticipationSchema.optional())
  .handler(async ({ db, user }) => {
    if (!user) return undefined;

    const profile = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!profile) return undefined;

    return {
      entries: 0,
      completedTasks: []
    };
  });

export default getUserSweepstakesParticipation;
