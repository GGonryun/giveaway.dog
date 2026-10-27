'use server';

import { revokeUserSessions } from '@giveaway/auth-core/session-revocation';
import { signOut } from '@giveaway/auth-server/config';
import { procedure } from '@giveaway/rpc-server/procedures';

const deleteUser = procedure()
  .authorization({ required: true })
  .handler(async ({ user, db }) => {
    await revokeUserSessions(user.id);
    await db.user.deleteMany({ where: { id: user.id } });
    await signOut({ redirectTo: '/' });
  });

export default deleteUser;
