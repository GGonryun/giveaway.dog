import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

export const getUser = procedure
  .authorized()
  .output(
    z.object({
      id: z.string(),
      email: z.string().nullable()
    })
  )
  .handler(async ({ user, db }) => {
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true
      }
    });

    if (!userData) {
      throw new Error('User not found');
    }

    return userData;
  });
