import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { giveawayFormSchema } from '@/schemas/giveaway/schemas';
import { SAMPLE_SWEEPSTAKES_DATA } from '../sample-sweepstakes-data';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
});

vi.mock('nanoid', () => {
  let count = 0;
  return { nanoid: vi.fn(() => `sample-${++count}`) };
});

describe('SAMPLE_SWEEPSTAKES_DATA', () => {
  it('starts one day after it is loaded and ends 128 days after', () => {
    expect(SAMPLE_SWEEPSTAKES_DATA.timing.startDate).toEqual(
      new Date('2026-06-16T12:00:00.000Z')
    );
    expect(SAMPLE_SWEEPSTAKES_DATA.timing.endDate).toEqual(
      new Date('2026-10-21T12:00:00.000Z')
    );
  });

  it('is valid for the demo editor, which skips the timing checks', async () => {
    const result = await giveawayFormSchema({
      validate: false,
      maxLoyalty: 0
    }).safeParseAsync(SAMPLE_SWEEPSTAKES_DATA);
    expect(result.error?.issues).toBeUndefined();
  });

  it('runs longer than the 90 days allowed outside of the demo', async () => {
    const result = await giveawayFormSchema({
      validate: true,
      maxLoyalty: 0
    }).safeParseAsync(SAMPLE_SWEEPSTAKES_DATA);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Duration cannot exceed 90 days'
    ]);
  });

  it('gives every task and prize a unique id', () => {
    const taskIds = SAMPLE_SWEEPSTAKES_DATA.tasks.map((task) => task.id);
    const prizeIds = SAMPLE_SWEEPSTAKES_DATA.prizes.map((prize) => prize.id);
    expect(new Set(taskIds).size).toBe(taskIds.length);
    expect(new Set(prizeIds).size).toBe(prizeIds.length);
  });

  it('lets participants log in with the default identities', () => {
    expect(SAMPLE_SWEEPSTAKES_DATA.audience.allowedIdentities).toEqual(
      DEFAULT_ALLOWED_IDENTITIES
    );
  });
});
