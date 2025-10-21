'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import {
  teamFeatureFlagKeySchema,
  parseTeamFeatureFlags
} from '@/schemas/feature-flags';

const getTeamFeatureFlags = procedure()
  .authorization({ required: true })
  .input(z.object({ slug: z.string() }))
  .output(z.array(teamFeatureFlagKeySchema))
  .handler(async ({ db, input }) => {
    const flags = await db.teamFeatureFlag.findMany({
      where: { team: { slug: input.slug } }
    });

    return parseTeamFeatureFlags(flags);
  });

export default getTeamFeatureFlags;
