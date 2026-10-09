'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { z } from 'zod';

/**
 * Force revalidates all cache tags for a specific sweepstakes.
 * Used when a user clicks refresh after a giveaway goes live.
 */
const refreshSweepstakes = procedure('participation-server/refreshSweepstakes')
  .authorization({ required: false })
  .input(z.object({ sweepstakesId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .invalidate(async ({ input }) => [
    `sweepstakes-${input.sweepstakesId}`,
    `participant-sweepstake`,
    `sweepstakes-${input.sweepstakesId}-privacy`,
    `sweepstakes-${input.sweepstakesId}-referral`,
    `sweepstakes-${input.sweepstakesId}-host`
  ])
  .handler(async () => {
    // Handler just returns success - the invalidation happens automatically
    return { success: true };
  });

export default refreshSweepstakes;
