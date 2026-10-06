import { describe, expect, it } from 'vitest';
import {
  E2E_MAX_DESCRIPTION_LENGTH,
  E2E_MAX_OFFSET_SECONDS,
  E2E_MAX_TEAM_MEMBERS,
  E2E_PRESET_STATUS,
  e2eRowsQuerySchema,
  e2eSweepstakesRequestSchema,
  e2eTeamRequestSchema,
  toE2eSweepstakesTiming
} from '../requests';

const NOW = new Date('2026-10-06T00:00:00.000Z');
const HOUR = 3600;
const DAY = 24 * HOUR;

const issuesOf = (result: {
  success: boolean;
  error?: { issues: { path: (string | number)[]; message: string }[] };
}) => result.error?.issues.map((i) => i.path.join('.')) ?? [];

describe('e2eTeamRequestSchema', () => {
  it('fills in the defaults', () => {
    expect(e2eTeamRequestSchema.parse({ ns: 'abc123', suffix: 'w0' })).toEqual({
      ns: 'abc123',
      suffix: 'w0',
      owner: 'host',
      members: [],
      tier: 'FREE'
    });
  });

  it('accepts members with every role but OWNER', () => {
    const request = {
      ns: 'abc123',
      suffix: 'w0',
      owner: 'host',
      members: [
        { persona: 'admin', role: 'ADMIN' },
        { persona: 'member', role: 'MEMBER' },
        { persona: 'guest', role: 'GUEST' },
        { persona: 'blocked', role: 'BLOCKED' }
      ],
      tier: 'PRO'
    };

    expect(e2eTeamRequestSchema.parse(request)).toEqual(request);
  });

  it('rejects a second OWNER', () => {
    const result = e2eTeamRequestSchema.safeParse({
      ns: 'abc123',
      suffix: 'w0',
      members: [{ persona: 'host2', role: 'OWNER' }]
    });

    expect(issuesOf(result)).toEqual(['members.0.role']);
  });

  it('rejects a slug longer than 20 characters', () => {
    const result = e2eTeamRequestSchema.safeParse({
      ns: 'abcdefghij',
      suffix: '123456'
    });

    expect(issuesOf(result)).toEqual(['suffix']);
  });

  it('accepts a slug of exactly 20 characters', () => {
    expect(
      e2eTeamRequestSchema.safeParse({ ns: 'abcdefghij', suffix: '12345' })
        .success
    ).toBe(true);
  });

  it('rejects a persona that joins twice', () => {
    const result = e2eTeamRequestSchema.safeParse({
      ns: 'abc123',
      suffix: 'w0',
      owner: 'host',
      members: [{ persona: 'host', role: 'ADMIN' }]
    });

    expect(issuesOf(result)).toEqual(['members']);
  });

  it(`rejects more than ${E2E_MAX_TEAM_MEMBERS} members`, () => {
    const result = e2eTeamRequestSchema.safeParse({
      ns: 'abc123',
      suffix: 'w0',
      members: Array.from({ length: E2E_MAX_TEAM_MEMBERS + 1 }, () => ({
        persona: 'member',
        role: 'MEMBER'
      }))
    });

    expect(issuesOf(result)).toContain('members');
  });

  it.each([
    ['an unknown field', { userId: 'someone' }],
    ['an email', { email: 'victim@example.com' }],
    ['a bad suffix', { suffix: 'W0' }],
    ['a bad namespace', { ns: 'ABC123' }],
    ['an unknown persona', { owner: 'root' }],
    ['an unknown tier', { tier: 'GOD' }]
  ])('rejects %s', (_, extra) => {
    expect(
      e2eTeamRequestSchema.safeParse({ ns: 'abc123', suffix: 'w0', ...extra })
        .success
    ).toBe(false);
  });
});

describe('e2eSweepstakesRequestSchema', () => {
  const base = { ns: 'abc123', team: 'e2e-abc123-w0' };

  it('fills in the defaults', () => {
    expect(e2eSweepstakesRequestSchema.parse(base)).toEqual({
      ...base,
      preset: 'running',
      name: 'Giveaway',
      visibility: 'UNLISTED'
    });
  });

  it.each([
    ['draft', {}],
    ['scheduled', { startsIn: 60 }],
    ['running', { startsIn: 0, endsIn: 60 }],
    ['ended', { startsIn: -2 * DAY, endsIn: 0 }],
    ['completed', { endsIn: -60 }]
  ])('accepts the %s preset', (preset, offsets) => {
    expect(
      e2eSweepstakesRequestSchema.safeParse({ ...base, preset, ...offsets })
        .success
    ).toBe(true);
  });

  it.each([
    ['scheduled', { startsIn: 0 }],
    ['running', { startsIn: 60 }],
    ['running', { endsIn: 0 }],
    ['ended', { endsIn: 60 }],
    ['completed', { endsIn: 60 }]
  ])('rejects the %s preset with %j', (preset, offsets) => {
    expect(
      issuesOf(
        e2eSweepstakesRequestSchema.safeParse({ ...base, preset, ...offsets })
      )
    ).toContain('preset');
  });

  it('rejects an end before the start', () => {
    const result = e2eSweepstakesRequestSchema.safeParse({
      ...base,
      preset: 'draft',
      startsIn: DAY,
      endsIn: HOUR
    });

    expect(issuesOf(result)).toEqual(['endsIn']);
  });

  it('accepts a slug in the namespace', () => {
    expect(
      e2eSweepstakesRequestSchema.safeParse({ ...base, slug: 'e2e-abc123-xss' })
        .success
    ).toBe(true);
  });

  it.each(['my-giveaway', 'e2e-abc124-xss', 'e2e-abc123'])(
    'rejects the slug %s outside the namespace',
    (slug) => {
      expect(
        issuesOf(e2eSweepstakesRequestSchema.safeParse({ ...base, slug }))
      ).toContain('slug');
    }
  );

  it.each([
    ['a team outside e2e', { team: 'acme' }],
    ['an unknown field', { teamId: 'someone' }],
    ['an unknown preset', { preset: 'archived' }],
    ['an offset that is not an integer', { startsIn: 1.5 }],
    ['a start too far away', { startsIn: E2E_MAX_OFFSET_SECONDS + 1 }],
    ['an empty name', { name: ' ' }],
    ['a name that is too long', { name: 'x'.repeat(81) }],
    [
      'a description that is too long',
      { description: 'x'.repeat(E2E_MAX_DESCRIPTION_LENGTH + 1) }
    ],
    ['an unknown visibility', { visibility: 'SECRET' }]
  ])('rejects %s', (_, extra) => {
    expect(
      e2eSweepstakesRequestSchema.safeParse({ ...base, ...extra }).success
    ).toBe(false);
  });
});

describe('toE2eSweepstakesTiming', () => {
  it.each([
    ['draft', DAY, 8 * DAY],
    ['scheduled', DAY, 8 * DAY],
    ['running', -HOUR, 7 * DAY],
    ['ended', -8 * DAY, -HOUR],
    ['completed', -8 * DAY, -HOUR]
  ] as const)('gives %s its default dates', (preset, startsIn, endsIn) => {
    expect(toE2eSweepstakesTiming({ preset }, NOW)).toEqual({
      startDate: new Date(NOW.getTime() + startsIn * 1000),
      endDate: new Date(NOW.getTime() + endsIn * 1000)
    });
  });

  it('uses the given offsets', () => {
    expect(
      toE2eSweepstakesTiming(
        { preset: 'running', startsIn: -60, endsIn: 120 },
        NOW
      )
    ).toEqual({
      startDate: new Date('2026-10-05T23:59:00.000Z'),
      endDate: new Date('2026-10-06T00:02:00.000Z')
    });
  });

  it('gives every default timing a valid preset', () => {
    for (const preset of Object.keys(E2E_PRESET_STATUS)) {
      expect(
        e2eSweepstakesRequestSchema.safeParse({
          ns: 'abc123',
          team: 'e2e-abc123-w0',
          preset
        }).success
      ).toBe(true);
    }
  });
});

describe('E2E_PRESET_STATUS', () => {
  it('maps each preset to the status the app gives it', () => {
    expect(E2E_PRESET_STATUS).toEqual({
      draft: 'DRAFT',
      scheduled: 'ACTIVE',
      running: 'ACTIVE',
      ended: 'ACTIVE',
      completed: 'COMPLETED'
    });
  });
});

describe('e2eRowsQuerySchema', () => {
  it.each([
    { view: 'team', slug: 'e2e-abc123-w0' },
    { view: 'sweepstakes', id: 'aB3_-x' },
    { view: 'participants', id: 'aB3_-x' },
    { view: 'jobs', id: 'aB3_-x' }
  ])('accepts %j', (query) => {
    expect(e2eRowsQuerySchema.parse(query)).toEqual(query);
  });

  it.each([
    { view: 'users' },
    { view: 'team', slug: 'acme' },
    { view: 'sweepstakes', id: 'a b' },
    { view: 'sweepstakes', id: 'x'.repeat(33) },
    { view: 'jobs', id: 'aB3_-x', where: '1=1' }
  ])('rejects %j', (query) => {
    expect(e2eRowsQuerySchema.safeParse(query).success).toBe(false);
  });
});

const messagesOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? [];

describe('e2eTeamRequestSchema details', () => {
  const base = { ns: 'abc123', suffix: 'w0' };

  it.each(['w0!', 'w0-', 'W0', ''])('rejects the suffix %j', (suffix) => {
    expect(e2eTeamRequestSchema.safeParse({ ...base, suffix }).success).toBe(
      false
    );
  });

  it('trims the team name', () => {
    expect(e2eTeamRequestSchema.parse({ ...base, name: '  Acme  ' }).name).toBe(
      'Acme'
    );
  });

  it.each([
    ['3 characters', 'abc'],
    ['20 characters', 'x'.repeat(20)]
  ])('accepts a name of %s', (_, name) => {
    expect(e2eTeamRequestSchema.parse({ ...base, name }).name).toBe(name);
  });

  it.each([
    ['2 characters', 'ab'],
    ['21 characters', 'x'.repeat(21)],
    ['2 characters after trimming', '  ab  ']
  ])('rejects a name of %s', (_, name) => {
    expect(issuesOf(e2eTeamRequestSchema.safeParse({ ...base, name }))).toEqual(
      ['name']
    );
  });

  it('explains a slug that is too long', () => {
    expect(
      messagesOf(
        e2eTeamRequestSchema.safeParse({ ns: 'abcdefghij', suffix: '123456' })
      )
    ).toEqual(['e2e-<ns>-<suffix> must have at most 20 characters']);
  });

  it('explains a persona that joins twice', () => {
    expect(
      messagesOf(
        e2eTeamRequestSchema.safeParse({
          ...base,
          members: [{ persona: 'host', role: 'ADMIN' }]
        })
      )
    ).toEqual(['Each persona joins the team at most once']);
  });
});

describe('e2eSweepstakesRequestSchema details', () => {
  const base = { ns: 'abc123', team: 'e2e-abc123-w0' };

  it('accepts a completed giveaway that ends now', () => {
    expect(
      e2eSweepstakesRequestSchema.safeParse({
        ...base,
        preset: 'completed',
        endsIn: 0
      }).success
    ).toBe(true);
  });

  it('rejects an end at the start, and explains it', () => {
    const result = e2eSweepstakesRequestSchema.safeParse({
      ...base,
      preset: 'draft',
      startsIn: HOUR,
      endsIn: HOUR
    });

    expect(issuesOf(result)).toEqual(['endsIn']);
    expect(messagesOf(result)).toEqual(['endsIn must be above startsIn']);
  });

  it('explains a slug outside the namespace', () => {
    expect(
      messagesOf(
        e2eSweepstakesRequestSchema.safeParse({ ...base, slug: 'my-giveaway' })
      )
    ).toEqual(['The slug must start with e2e-abc123-']);
  });

  it.each(['e2e-abc123-a!b', 'e2e-abc123-a b', 'e2e-abc123-A'])(
    'rejects the slug %s',
    (slug) => {
      expect(
        issuesOf(e2eSweepstakesRequestSchema.safeParse({ ...base, slug }))
      ).toEqual(['slug']);
    }
  );
});

describe('e2eRowsQuerySchema details', () => {
  it.each([
    { view: 'team', id: 'aB3_-x' },
    { view: 'sweepstakes', slug: 'e2e-abc123-w0' },
    { view: 'participants' },
    { view: 'jobs' },
    { id: 'aB3_-x' },
    {}
  ])('rejects %j', (query) => {
    expect(e2eRowsQuerySchema.safeParse(query).success).toBe(false);
  });
});
