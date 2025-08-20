'use server';

import { redirect } from 'next/navigation';
import getUserTeams from './get-user-teams';
import { mRPC } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';

const selectTeam = mRPC
  .secure()
  .input(z.string())
  .action(async ({ input: teamId }) => {
    const teams = await getUserTeams();
    if (teams.ok) {
      const selectedTeam = teams.data.find((team) => team.id === teamId);

      if (!selectedTeam) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: `Team with ID ${teamId} not found`
        });
      }

      redirect(`/app/${selectedTeam.slug}`);
    } else {
      throw new ApplicationError({
        ...teams.data,
        cause: 'Failed to retrieve user teams'
      });
    }
  });

export default selectTeam;
