import type { APIRequestContext, Page } from '@playwright/test';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect } from '../fixtures/test';
import { seedApi, type SeededJob, type SeededJobs } from './seed';

export const MIN_TIME_MARGIN_SECONDS = 60;

const POLL_INTERVAL_MS = 2_000;

export const GIVEAWAY_STATES = {
  scheduled: 'Your sweepstakes is scheduled to start',
  running: 'Your sweepstakes is live',
  ended: 'Your sweepstakes has ended',
  completed: 'Your sweepstakes is complete'
} as const;

export type GiveawayState = keyof typeof GIVEAWAY_STATES;

const assertMargin = (name: string, seconds: number | undefined) => {
  if (seconds !== undefined && Math.abs(seconds) < MIN_TIME_MARGIN_SECONDS) {
    throw new Error(
      `${name} must be at least ${MIN_TIME_MARGIN_SECONDS} seconds away from now, not ${seconds}: the clocks of the runner and the deployment can differ`
    );
  }
};

export const seedSweepstakes = async (
  request: APIRequestContext,
  body: E2eSweepstakesRequestInput
) => {
  assertMargin('startsIn', body.startsIn);
  assertMargin('endsIn', body.endsIn);
  const seededAt = Date.now();
  const giveaway = await seedApi(request).sweepstakes(body);
  const { startsIn, endsIn } = body;
  return {
    ...giveaway,
    startsAt: new Date(
      startsIn === undefined ? giveaway.startDate : seededAt + startsIn * 1000
    ),
    endsAt: new Date(
      endsIn === undefined ? giveaway.endDate : seededAt + endsIn * 1000
    )
  };
};

export const waitUntil = (at: Date) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, at.getTime() - Date.now()))
  );

export const runJobs = async (
  request: APIRequestContext,
  sweepstakesId: string
) => {
  const run = await seedApi(request).runJobs(sweepstakesId);
  const failed = (['tasks', 'sweepstakes', 'posts'] as const).filter(
    (name) => !run[name].ok
  );
  if (failed.length > 0) {
    throw new Error(
      `The ${failed.join(', ')} jobs of ${sweepstakesId} failed: ${JSON.stringify(run)}`
    );
  }
  return run;
};

export const jobStatuses = (jobs: (SeededJob & { type: string })[]) =>
  Object.fromEntries(jobs.map((job) => [job.type, job.status]));

export const sweepstakesJobStatuses = ({ jobs }: SeededJobs) =>
  jobStatuses(jobs.sweepstakes);

export const waitForGiveawayState = async (
  page: Page,
  state: GiveawayState,
  { timeout = 30_000 }: { timeout?: number } = {}
) => {
  const label = page.getByText(GIVEAWAY_STATES[state], { exact: true });
  const deadline = Date.now() + timeout;
  for (;;) {
    const left = deadline - Date.now();
    try {
      await expect(label).toBeVisible({
        timeout: Math.max(0, Math.min(left, POLL_INTERVAL_MS))
      });
      return;
    } catch (error) {
      if (left <= POLL_INTERVAL_MS) {
        if (error instanceof Error) {
          error.message = `The giveaway did not reach the state "${state}" within ${timeout} ms\n\n${error.message}`;
        }
        throw error;
      }
      await page.reload();
    }
  }
};
