'use server';

import getUserTeams from './get-user-teams';
import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import { ApplicationError } from '@/lib/errors';

const selectTeam = procedure
  .authorization({ required: true })
  .input(z.object({ id: z.string() }))
  .output(z.object({ name: z.string(), slug: z.string() }))
  .handler(async ({ input }) => {
    const teams = await getUserTeams();
    if (!teams.ok) {
      throw new ApplicationError({
        ...teams.data,
        cause: 'Failed to retrieve user teams'
      });
    }

    const selectedTeam = teams.data.find((team) => team.id === input.id);

    if (!selectedTeam) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: `Team not found`
      });
    }

    return selectedTeam;
  });

export default selectTeam;
