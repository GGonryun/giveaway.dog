'use server';

import { signOut } from '@giveaway/auth-server/config';
import { procedure } from '@giveaway/rpc-server/procedures';

const deleteUser = procedure('account-server/deleteUser')
  .authorization({ required: true })
  .handler(async ({ user, db }) => {
    await db.user.deleteMany({ where: { id: user.id } });
    await signOut({ redirectTo: '/' });
  });

export default deleteUser;
