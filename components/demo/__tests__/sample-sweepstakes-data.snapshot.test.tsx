import { describe, expect, it, vi } from 'vitest';
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
  it('matches the snapshot', () => {
    expect(SAMPLE_SWEEPSTAKES_DATA).toMatchSnapshot();
  });
});
