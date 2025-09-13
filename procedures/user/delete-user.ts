'use server';

import { signOut } from '@/lib/auth';
import { procedure } from '@/lib/mrpc/procedures';

const deleteUser = procedure
  .authorization({ required: true })
  .handler(async ({ user, db }) => {
    await db.user.deleteMany({ where: { id: user.id } });
    await signOut({ redirectTo: '/' });
  });

export default deleteUser;
