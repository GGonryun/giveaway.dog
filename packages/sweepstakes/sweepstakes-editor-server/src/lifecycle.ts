import 'server-only';

import { nanoid } from 'nanoid';
import { SweepstakesStatus } from '@giveaway/db-model';
import {
  DEFAULT_SWEEPSTAKES_AUDIENCE,
  DEFAULT_SWEEPSTAKES_DESIGN,
  DEFAULT_SWEEPSTAKES_DETAILS,
  DEFAULT_SWEEPSTAKES_PRIZES,
  DEFAULT_SWEEPSTAKES_TASKS,
  DEFAULT_SWEEPSTAKES_TERMS,
  DEFAULT_SWEEPSTAKES_TIMING,
  DEFAULT_SWEEPSTAKES_VISIBILITY,
  DEFAULT_SWEEPSTAKES_WINNER_CRITERIA
} from '@giveaway/sweepstakes-model/defaults';

export const SWEEPSTAKE_ID_SIZE = 6;

export const toNewSweepstakesData = ({
  teamId,
  teamName,
  timezone
}: {
  teamId: string;
  teamName: string;
  timezone: string;
}) => ({
  id: nanoid(SWEEPSTAKE_ID_SIZE),
  teamId,
  status: SweepstakesStatus.DRAFT,
  details: {
    create: DEFAULT_SWEEPSTAKES_DETAILS
  },
  timing: {
    create: { ...DEFAULT_SWEEPSTAKES_TIMING, timeZone: timezone }
  },
  audience: {
    create: DEFAULT_SWEEPSTAKES_AUDIENCE
  },
  terms: {
    create: { ...DEFAULT_SWEEPSTAKES_TERMS, sponsorName: teamName }
  },
  prizes: {
    createMany: { data: DEFAULT_SWEEPSTAKES_PRIZES }
  },
  tasks: {
    createMany: { data: DEFAULT_SWEEPSTAKES_TASKS }
  },
  design: {
    create: DEFAULT_SWEEPSTAKES_DESIGN
  },
  visibility: {
    create: DEFAULT_SWEEPSTAKES_VISIBILITY
  },
  criteria: {
    create: DEFAULT_SWEEPSTAKES_WINNER_CRITERIA
  }
});
