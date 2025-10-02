'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { userSchema } from '@/schemas/user';
import { getUserQuery, userCache } from './shared';
import { ApplicationError } from '@/lib/errors';

const getUser = procedure()
  .authorization({ required: true })
  .output(userSchema)
  .cache(userCache.fn)
  .handler(async ({ user, db }) => {
    const data = await getUserQuery(db, user.id);
    if (!data) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    return data;
  });

export default getUser;
