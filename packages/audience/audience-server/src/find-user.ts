'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { userSchema } from '@giveaway/user-model/user';
import { getUserQuery } from '@giveaway/account-server/shared';
import { z } from 'zod';

const findUser = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      self: z.literal(true)
    })
  )
  .output(userSchema.nullable())
  .handler(async ({ db, user }) => {
    if (!user?.id) return null;
    return await getUserQuery(db, user.id);
  });

export default findUser;
