import { procedure } from '@/lib/mrpc/procedures';
import { parseProviders, userProfileSchema } from '@/schemas/user';
import { PrismaClient } from '@prisma/client';
import { getUserQuery, userProfileCache } from './shared';
import { ApplicationError } from '@/lib/errors';

const getUser = procedure
  .authorization({ required: true })
  .output(userProfileSchema)
  .cache(userProfileCache.fn)
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
