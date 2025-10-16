'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import {
  featureFlagKeySchema,
  parseFeatureFlags
} from '@/schemas/feature-flags';

const getUserFeatureFlags = procedure()
  .authorization({ required: true })
  .output(z.array(featureFlagKeySchema))
  .handler(async ({ db, user }) => {
    const flags = await db.featureFlag.findMany({
      where: { userId: user.id }
    });

    return parseFeatureFlags(flags);
  });

export default getUserFeatureFlags;
