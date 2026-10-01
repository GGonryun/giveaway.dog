import { describe, it, expect } from 'vitest';
import { omit } from 'lodash';
import { winnerLeaderboardSchema } from '../winners';

const win = (overrides: Record<string, unknown> = {}) => ({
  sweepstakesId: 'sweep-1',
  sweepstakesName: 'Sweep',
  sweepstakesSlug: 'sweep',
  teamSlug: 'acme',
  prizeName: 'Prize',
  wonAt: '2026-01-01T00:00:00.000Z',
  ...overrides
});

const entry = (overrides: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  userName: 'Jane',
  userImage: 'https://example.com/a.png',
  winCount: 1,
  wins: [win()],
  ...overrides
});

describe('winnerLeaderboardSchema', () => {
  it('coerces the win timestamp into a date', () => {
    const parsed = winnerLeaderboardSchema.parse(entry());

    expect(parsed.wins[0].wonAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('accepts null user name, user image, and prize name', () => {
    const parsed = winnerLeaderboardSchema.parse(
      entry({
        userName: null,
        userImage: null,
        wins: [win({ prizeName: null })]
      })
    );

    expect(parsed).toMatchObject({
      userName: null,
      userImage: null,
      wins: [{ prizeName: null }]
    });
  });

  it('accepts an empty list of wins', () => {
    expect(
      winnerLeaderboardSchema.parse(entry({ winCount: 0, wins: [] })).wins
    ).toEqual([]);
  });

  it('rejects a missing user name instead of treating it as null', () => {
    const result = winnerLeaderboardSchema.safeParse(omit(entry(), 'userName'));

    expect(result.error?.issues.map((i) => i.path)).toEqual([['userName']]);
  });

  it('rejects a win count that is not a number', () => {
    const result = winnerLeaderboardSchema.safeParse(entry({ winCount: '1' }));

    expect(result.error?.issues.map((i) => i.path)).toEqual([['winCount']]);
  });

  it('rejects a win timestamp that cannot be parsed', () => {
    const result = winnerLeaderboardSchema.safeParse(
      entry({ wins: [win({ wonAt: 'not a date' })] })
    );

    expect(result.error?.issues.map((i) => i.path)).toEqual([
      ['wins', 0, 'wonAt']
    ]);
  });

  it('requires the team slug on every win', () => {
    const result = winnerLeaderboardSchema.safeParse(
      entry({ wins: [win({ teamSlug: undefined })] })
    );

    expect(result.error?.issues.map((i) => i.path)).toEqual([
      ['wins', 0, 'teamSlug']
    ]);
  });
});
