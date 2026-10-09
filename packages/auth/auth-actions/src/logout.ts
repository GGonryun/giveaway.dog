'use server';

import { signOut } from '@giveaway/auth-server/config';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';

const logout = procedure('auth-actions/logout')
  .authorization({ required: true })
  .input(z.string())
  .handler(async ({ input }) => await signOut({ redirectTo: input }));

export default logout;
