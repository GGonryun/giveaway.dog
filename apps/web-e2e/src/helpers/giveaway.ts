import { expect, type Page } from '@playwright/test';

export const GIVEAWAY_STATES = {
  draft: 'Your sweepstakes is being prepared',
  scheduled: 'Your sweepstakes is scheduled to start',
  running: 'Your sweepstakes is live',
  expired: 'Your sweepstakes has ended',
  completed: 'Your sweepstakes is complete'
} as const;

export type GiveawayState = keyof typeof GIVEAWAY_STATES;

const POLL_INTERVAL_MS = 2_000;

export const hostPreviewUrl = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/preview`;

export const waitForGiveawayState = async (
  page: Page,
  state: GiveawayState,
  { timeout = 30_000 }: { timeout?: number } = {}
) => {
  const description = page.getByText(GIVEAWAY_STATES[state], { exact: true });
  let first = true;
  await expect(async () => {
    if (!first) await page.reload({ waitUntil: 'networkidle' });
    first = false;
    await expect(description).toBeVisible({ timeout: POLL_INTERVAL_MS });
  }).toPass({ timeout, intervals: [0] });
};
