'use server';

import { signOut } from '@/lib/auth';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

const logout = procedure()
  .authorization({ required: true })
  .input(z.string())
  .handler(async ({ input }) => await signOut({ redirectTo: input }));

export default logout;
