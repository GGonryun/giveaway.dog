'use server';

import { procedure } from '@/lib/mrpc/procedures';

const invalidateUser = procedure()
  .authorization({ required: true })
  .invalidate(async ({ user }) => [`user-${user.id}`])
  .handler(async () => {
    return true;
  });

export default invalidateUser;
