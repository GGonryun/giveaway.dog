'use server';

import { signOut } from '@/lib/auth';
import { procedure } from '@/lib/mrpc/procedures';

const logout = procedure
  .authorized()
  .handler(async () => await signOut({ redirectTo: '/' }));

export default logout;
