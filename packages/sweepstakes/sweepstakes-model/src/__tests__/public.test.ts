import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { z } from 'zod';
import { publicSweepstakesSchema, tryToPublicSweepstakes } from '../public';
import type { PublicSweepstakesGetPayload } from '../db';

type Payload = PublicSweepstakesGetPayload;
type Task = Payload['tasks'][number];
type Completion = Task['completions'][number];
type StoredUser = Completion['participant']['user'];

const NOW = new Date('2026-10-01T12:00:00.000Z');
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');

const storedUser = (id: string): StoredUser => ({
  id,
  name: null,
  email: null,
  emailVerified: null,
  username: null,
  birthday: null,
  image: null,
  emoji: null,
  onboarded: false,
  accountType: 'PARTICIPANT',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  source: 'SIGNUP',
  preferredContactMethod: null
});

const completion = (taskId: string, participantId: string): Completion => ({
  id: `completion-${taskId}-${participantId}`,
  participantId,
  taskId,
  completedAt: CREATED_AT,
  proof: null,
  reason: null,
  status: 'COMPLETED',
  participant: {
    id: participantId,
    userId: `user-${participantId}`,
    sweepstakesId: 'sweep-1',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    user: storedUser(`user-${participantId}`)
  }
});

const task = (id: string, participantIds: string[]): Task => ({
  id,
  sweepstakesId: 'sweep-1',
  index: 0,
  config: null,
  completions: participantIds.map((participantId) =>
    completion(id, participantId)
  )
});

const sweepstakes = (overrides: Partial<Payload> = {}): Payload => ({
  id: 'sweep-1',
  status: 'ACTIVE',
  teamId: 'team-1',
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  tasks: [],
  prizes: [],
  audience: null,
  terms: null,
  details: {
    id: 'details-1',
    sweepstakesId: 'sweep-1',
    name: 'My Giveaway',
    description: 'Win stuff',
    banner: 'https://example.com/banner.png'
  },
  timing: {
    id: 'timing-1',
    sweepstakesId: 'sweep-1',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-11-01T00:00:00.000Z'),
    timeZone: 'UTC'
  },
  team: {
    id: 'team-1',
    name: 'Acme',
    slug: 'acme',
    logo: 'https://example.com/logo.png',
    links: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    tier: 'FREE'
  },
  visibility: {
    id: 'visibility-1',
    sweepstakesId: 'sweep-1',
    visibility: 'PUBLIC',
    slug: 'my-giveaway',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  },
  ...overrides
});

const prize = (id: string): Payload['prizes'][number] => ({
  id,
  sweepstakesId: 'sweep-1',
  name: 'Prize',
  index: 0,
  quota: 1,
  draws: []
});

describe('publicSweepstakesSchema', () => {
  const value = {
    id: 'sweep-1',
    name: 'My Giveaway',
    description: 'Win stuff',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-11-01T00:00:00.000Z',
    prizes: 1,
    host: { id: 'team-1', slug: 'acme', name: 'Acme' },
    status: 'RUNNING',
    participants: 0
  };

  it('coerces the dates and leaves the optional fields out', () => {
    expect(publicSweepstakesSchema.parse(value)).toEqual({
      ...value,
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-11-01T00:00:00.000Z')
    });
  });

  it('rejects a status that is not a derived status', () => {
    expect(
      publicSweepstakesSchema.safeParse({ ...value, status: 'ACTIVE' }).success
    ).toBe(false);
  });

  it('rejects a host without a slug', () => {
    const result = publicSweepstakesSchema.safeParse({
      ...value,
      host: { id: 'team-1', name: 'Acme' }
    });

    expect(result.error?.issues.map((i) => i.path)).toEqual([['host', 'slug']]);
  });
});

describe('tryToPublicSweepstakes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the sweepstakes is complete', () => {
    it('maps it into the public shape', () => {
      expect(
        tryToPublicSweepstakes(
          sweepstakes({
            prizes: [prize('p1'), prize('p2')],
            tasks: [task('task-1', ['a', 'b'])]
          })
        )
      ).toEqual({
        id: 'sweep-1',
        slug: 'my-giveaway',
        name: 'My Giveaway',
        description: 'Win stuff',
        banner: 'https://example.com/banner.png',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-11-01T00:00:00.000Z'),
        status: 'RUNNING',
        host: { id: 'team-1', slug: 'acme', name: 'Acme' },
        prizes: 2,
        participants: 2,
        featured: false
      });
    });

    it('counts each participant once across tasks', () => {
      const result = tryToPublicSweepstakes(
        sweepstakes({
          tasks: [
            task('task-1', ['a', 'b']),
            task('task-2', ['b', 'c']),
            task('task-3', [])
          ]
        })
      );

      expect(result?.participants).toBe(3);
    });

    it('reports zero prizes and participants for an empty sweepstakes', () => {
      expect(tryToPublicSweepstakes(sweepstakes())).toMatchObject({
        prizes: 0,
        participants: 0
      });
    });

    it('reports zero prizes when the prizes relation has no length', () => {
      expect(
        tryToPublicSweepstakes(
          sweepstakes({ prizes: {} as unknown as Payload['prizes'] })
        )?.prizes
      ).toBe(0);
    });

    it('turns a null slug and banner into undefined', () => {
      const payload = sweepstakes();

      const result = tryToPublicSweepstakes({
        ...payload,
        details: { ...payload.details!, banner: null },
        visibility: { ...payload.visibility!, slug: null }
      });

      expect(result?.slug).toBeUndefined();
      expect(result?.banner).toBeUndefined();
    });

    it('omits the slug when no visibility is stored', () => {
      expect(
        tryToPublicSweepstakes(sweepstakes({ visibility: null }))?.slug
      ).toBeUndefined();
    });
  });

  describe('derived status', () => {
    it('reports a draft sweepstakes as DRAFT', () => {
      expect(
        tryToPublicSweepstakes(sweepstakes({ status: 'DRAFT' }))?.status
      ).toBe('DRAFT');
    });

    it('reports a completed sweepstakes as COMPLETED', () => {
      expect(
        tryToPublicSweepstakes(sweepstakes({ status: 'COMPLETED' }))?.status
      ).toBe('COMPLETED');
    });

    it('reports an active sweepstakes that has not started as SCHEDULED', () => {
      const payload = sweepstakes();

      const result = tryToPublicSweepstakes({
        ...payload,
        timing: {
          ...payload.timing!,
          startDate: new Date('2026-10-05T00:00:00.000Z')
        }
      });

      expect(result?.status).toBe('SCHEDULED');
    });

    it('reports an active sweepstakes that has ended as EXPIRED', () => {
      const payload = sweepstakes();

      const result = tryToPublicSweepstakes({
        ...payload,
        timing: {
          ...payload.timing!,
          endDate: new Date('2026-09-30T00:00:00.000Z')
        }
      });

      expect(result?.status).toBe('EXPIRED');
    });
  });

  describe('when the sweepstakes cannot be represented publicly', () => {
    it('returns undefined and logs the parse error when the details are missing', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = tryToPublicSweepstakes(sweepstakes({ details: null }));

      expect(result).toBeUndefined();
      expect(error).toHaveBeenCalledWith(
        'Public sweepstakes parse error:',
        expect.any(z.ZodError)
      );
    });

    it('returns undefined when the team is missing', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(
        tryToPublicSweepstakes(sweepstakes({ team: null }))
      ).toBeUndefined();
    });

    it('returns undefined when the timing is missing', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(
        tryToPublicSweepstakes(sweepstakes({ timing: null }))
      ).toBeUndefined();
    });
  });

  describe('when the stored end date is null', () => {
    it('coerces the end date to the unix epoch and reports an ERROR status', () => {
      const payload = sweepstakes();

      const result = tryToPublicSweepstakes({
        ...payload,
        timing: { ...payload.timing!, endDate: null }
      });

      expect(result).toMatchObject({
        endDate: new Date(0),
        status: 'ERROR'
      });
    });
  });
});
