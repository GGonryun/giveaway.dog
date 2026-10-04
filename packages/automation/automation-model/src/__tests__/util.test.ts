import { describe, it, expect } from 'vitest';
import type { GiveawaySchema } from '@giveaway/sweepstakes-model/schemas';
import { generateSkeetText } from '../util';

const LIVE_URL = 'https://giveaway.dog/browse/sweep-1';

const sweepstakes = ({
  prizes = [],
  name = 'Summer Giveaway',
  endDate
}: {
  prizes?: { name: string }[];
  name?: string;
  endDate?: Date | string | null;
}) =>
  ({
    prizes,
    setup: { name },
    timing: { endDate }
  }) as unknown as GiveawaySchema;

describe('generateSkeetText', () => {
  it('renders the full template with the first prize name and the short end date', () => {
    const text = generateSkeetText({
      sweepstakes: sweepstakes({
        prizes: [{ name: 'Gaming Laptop' }, { name: 'Mouse' }],
        endDate: new Date(2026, 5, 15, 12, 0, 0)
      }),
      liveUrl: LIVE_URL
    });

    expect(text).toBe(
      [
        '🎉 GIVEAWAY TIME 🎉',
        '',
        '🥇 Prize: Gaming Laptop',
        '⏰ Ends: Jun 15, 2026',
        '',
        'Rules:',
        '🙆 Follow',
        '🔁 Repost',
        '❤️ Like',
        '',
        '👇 Get bonus entries',
        '',
        LIVE_URL
      ].join('\n')
    );
  });

  it('falls back to the sweepstakes name when there are no prizes', () => {
    const text = generateSkeetText({
      sweepstakes: sweepstakes({ endDate: new Date(2026, 0, 2, 12) }),
      liveUrl: LIVE_URL
    });

    expect(text).toContain('🥇 Prize: Summer Giveaway\n');
  });

  it('uses TBD when the end date is missing', () => {
    const text = generateSkeetText({
      sweepstakes: sweepstakes({ endDate: null }),
      liveUrl: LIVE_URL
    });

    expect(text).toContain('⏰ Ends: TBD\n');
  });

  it('accepts an end date given as a string', () => {
    const text = generateSkeetText({
      sweepstakes: sweepstakes({
        endDate: new Date(2026, 11, 31, 12).toISOString()
      }),
      liveUrl: LIVE_URL
    });

    expect(text).toContain('⏰ Ends: Dec 31, 2026\n');
  });

  it('ends with the live url', () => {
    const text = generateSkeetText({
      sweepstakes: sweepstakes({ endDate: null }),
      liveUrl: 'https://example.com/x'
    });

    expect(text.endsWith('\n\nhttps://example.com/x')).toBe(true);
  });
});
