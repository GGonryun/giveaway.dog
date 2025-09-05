import { procedure } from '@/lib/mrpc/procedures';
import { userSchema } from '@/schemas/user';
import { getUserQuery, userCache } from './shared';

const findUser = procedure
  .authorization({ required: false })
  .output(userSchema.nullable())
  .cache(userCache.fn)
  .handler(async ({ db, user }) => {
    if (!user?.id) return null;
    return await getUserQuery(db, user.id);
  });

export default findUser;
