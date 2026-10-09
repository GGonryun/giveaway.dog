'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { userSchema } from '@giveaway/user-model/user';
import { getUserQuery } from '@giveaway/account-server/shared';
import { z } from 'zod';

const findUser = procedure('audience-server/findUser')
  .authorization({ required: false })
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
  .output(userSchema.nullable())
  .handler(async ({ db, user, input }) => {
    if (!user?.id) return null;
    return await getUserQuery(db, 'self' in input ? user.id : input.userId);
  });

export default findUser;
