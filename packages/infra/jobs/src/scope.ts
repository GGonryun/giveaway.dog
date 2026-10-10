import 'server-only';

export type JobScope = {
  sweepstakesId?: string;
};

export const MAX_JOBS_PER_RUN = 5;

export const toSweepstakesJobScope = ({ sweepstakesId }: JobScope = {}) =>
  sweepstakesId === undefined ? {} : { sweepstakesId };

export const toTaskJobScope = ({ sweepstakesId }: JobScope = {}) =>
  sweepstakesId === undefined ? {} : { task: { sweepstakesId } };
