import 'server-only';

import { SweepstakesStatus } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

export const assertNotCompleted = (sweepstakes: {
  status: SweepstakesStatus;
}) => {
  if (sweepstakes.status === SweepstakesStatus.COMPLETED) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Completed sweepstakes cannot be modified.'
    });
  }
};
