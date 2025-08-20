'use server';

import { createTeamInputSchema } from '@/schemas/teams';
import { mRPC } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';

const createTeam = mRPC
  .secure()
  .input(createTeamInputSchema)
  .action(async ({ user, input }) => {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'This team slug is already taken'
    });
  });

export default createTeam;
