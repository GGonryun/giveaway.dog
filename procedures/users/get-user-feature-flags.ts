'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { z } from 'zod';
import {
  userFeatureFlagKeySchema,
  parseUserFeatureFlags
} from '@/schemas/feature-flags';

const getUserFeatureFlags = procedure()
  .authorization({ required: true })
  .output(z.array(userFeatureFlagKeySchema))
  .handler(async ({ db, user }) => {
    const flags = await db.userFeatureFlag.findMany({
      where: { userId: user.id }
    });

    return parseUserFeatureFlags(flags);
  });

export default getUserFeatureFlags;
