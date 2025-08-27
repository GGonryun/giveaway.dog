import { procedure } from '@/lib/mrpc/procedures';
import { userProfileSchema } from '@/schemas/user';
import { getUserQuery, userProfileCache } from './shared';

const findUser = procedure
  .authorization({ required: false })
  .output(userProfileSchema.nullable())
  .cache(userProfileCache.fn)
  .handler(async ({ db, user }) => {
    if (!user?.id) return null;

    return await getUserQuery(db, user.id);
  });

export default findUser;
