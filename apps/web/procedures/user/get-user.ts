'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { userSchema } from '@giveaway/user-model/user';
import { getUserQuery } from './shared';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';

const getUser = procedure()
  .authorization({ required: true })
  .input(
    z.union([
      z.object({
        userId: z.string()
      }),
      z.object({
        self: z.literal(true)
      })
    ])
  )
  .output(userSchema)
  .handler(async ({ user, db, input }) => {
    const data = await getUserQuery(
      db,
      'self' in input ? user.id : input.userId
    );
    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    return data;
  });

export default getUser;
