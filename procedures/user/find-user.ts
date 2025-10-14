'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { userSchema } from '@/schemas/user';
import { getUserQuery, userCache } from './shared';
import { z } from 'zod';

const findUser = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      self: z.literal(true)
    })
  )
  .output(userSchema.nullable())
  .cache(userCache.fn)
  .handler(async ({ db, user }) => {
    if (!user?.id) return null;
    return await getUserQuery(db, user.id);
  });

export default findUser;
