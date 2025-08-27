'use server';

import { signOut } from '@/lib/auth';
import { procedure } from '@/lib/mrpc/procedures';

const logout = procedure
  .authorization({ required: true })
  .handler(async () => await signOut({ redirectTo: '/' }));

export default logout;
