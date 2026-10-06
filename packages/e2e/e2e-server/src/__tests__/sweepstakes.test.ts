import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { e2eSweepstakesRequestSchema } from '@giveaway/e2e-model/requests';
import { applySweepstakesChanges } from '@giveaway/sweepstakes-access/shared';
import { seedE2eSweepstakes } from '../sweepstakes';
import { e2eUser, NOW, realUser, teamRow } from './fixtures';

vi.mock('@giveaway/sweepstakes-access/shared', () => ({
  applySweepstakesChanges: vi.fn()
}));

const db = asPrismaClient();
const ID = 'sw-e2e';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const formRecord = () => ({
  id: ID,
  status: 'DRAFT',
  teamId: 'team-e2e-abc123-w0',
  details: {
    name: 'My Giveaway',
    description: 'Enter to win a prize!',
    banner: null
  },
  terms: null,
  audience: null,
  timing: null,
  prizes: [],
  tasks: [],
  design: null,
  visibility: { visibility: 'UNLISTED', slug: null },
  criteria: null
});

const seed = (request: Record<string, unknown>, allowPublic = false) =>
  seedE2eSweepstakes({
    db,
    request: e2eSweepstakesRequestSchema.parse({
      ns: 'abc123',
      team: 'e2e-abc123-w0',
      ...request
    }),
    now: NOW,
    allowPublic
  });

const appliedInput = () =>
  vi.mocked(applySweepstakesChanges).mock.calls[0][0].input;

beforeEach(() => {
  prismaMock.team.findUnique.mockResolvedValue(teamRow());
  prismaMock.sweepstakesVisibility.findUnique.mockResolvedValue(null);
  prismaMock.sweepstakes.create.mockResolvedValue({ id: ID });
  prismaMock.sweepstakes.findUniqueOrThrow.mockResolvedValue(formRecord());
  vi.mocked(applySweepstakesChanges)
    .mockReset()
    .mockResolvedValue({} as never);
});

describe('seedE2eSweepstakes', () => {
  it('creates the giveaway from the editor defaults for the team', async () => {
    await seed({});

    expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        teamId: 'team-e2e-abc123-w0',
        status: 'DRAFT',
        timing: { create: expect.objectContaining({ timeZone: 'UTC' }) },
        terms: {
          create: expect.objectContaining({ sponsorName: 'e2e-abc123-w0' })
        }
      }),
      select: { id: true }
    });
  });

  it('applies the changes as the owner persona', async () => {
    await seed({});

    expect(applySweepstakesChanges).toHaveBeenCalledWith({
      db,
      user: {
        id: 'user-host',
        name: 'E2E host',
        email: 'e2e-host-abc123@example.com',
        image: '',
        username: '',
        onboarded: true,
        accountType: 'HOST'
      },
      input: expect.objectContaining({ id: ID })
    });
  });

  it('names the giveaway after the namespace and keeps the other editor values', async () => {
    await seed({ name: 'Summer', description: '<img src=x onerror=alert(1)>' });

    expect(appliedInput().setup).toEqual({
      name: '[e2e abc123] Summer',
      description: '<img src=x onerror=alert(1)>',
      banner: undefined
    });
    expect(appliedInput().audience).toBeDefined();
    expect(appliedInput().criteria).toBeDefined();
  });

  it('keeps the default description when none is given', async () => {
    await seed({});

    expect(appliedInput().setup?.description).toBe('Enter to win a prize!');
  });

  it.each([
    ['draft', 'DRAFT', DAY, 8 * DAY],
    ['scheduled', 'ACTIVE', DAY, 8 * DAY],
    ['running', 'ACTIVE', -HOUR, 7 * DAY],
    ['ended', 'ACTIVE', -8 * DAY, -HOUR],
    ['completed', 'ACTIVE', -8 * DAY, -HOUR]
  ])(
    'publishes the %s preset with status %s and its dates',
    async (preset, status, start, end) => {
      await seed({ preset });

      expect(appliedInput()).toMatchObject({
        status,
        timing: {
          startDate: new Date(NOW.getTime() + start),
          endDate: new Date(NOW.getTime() + end),
          timeZone: 'UTC'
        }
      });
    }
  );

  it('marks a completed giveaway COMPLETED with a pending completion job, as the editor does', async () => {
    const result = await seed({ preset: 'completed' });

    expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: { status: 'COMPLETED' }
    });
    expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith({
      where: {
        sweepstakesId_type: { sweepstakesId: ID, type: 'PROCESS_COMPLETION' }
      },
      update: { runAt: NOW },
      create: {
        sweepstakesId: ID,
        type: 'PROCESS_COMPLETION',
        status: 'PENDING',
        runAt: NOW
      }
    });
    expect(result.status).toBe('COMPLETED');
  });

  it.each(['draft', 'scheduled', 'running', 'ended'])(
    'does not complete the %s preset',
    async (preset) => {
      await seed({ preset });

      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
    }
  );

  it('keeps the giveaway UNLISTED by default', async () => {
    await seed({});

    expect(appliedInput().visibility).toEqual({
      visibility: 'UNLISTED',
      slug: null
    });
  });

  it('uses the given slug', async () => {
    await seed({ slug: 'e2e-abc123-xss' });

    expect(appliedInput().visibility).toEqual({
      visibility: 'UNLISTED',
      slug: 'e2e-abc123-xss'
    });
  });

  it('refuses a slug that is taken, before it creates anything', async () => {
    prismaMock.sweepstakesVisibility.findUnique.mockResolvedValue({
      id: 'v-1'
    });

    await expect(seed({ slug: 'e2e-abc123-xss' })).rejects.toMatchObject({
      code: 'CONFLICT'
    });
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('refuses a PUBLIC giveaway unless public giveaways are allowed', async () => {
    await expect(seed({ visibility: 'PUBLIC' })).rejects.toMatchObject({
      code: 'FORBIDDEN'
    });
    expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('creates a PUBLIC giveaway when public giveaways are allowed', async () => {
    await seed({ visibility: 'PUBLIC' }, true);

    expect(appliedInput().visibility).toEqual({
      visibility: 'PUBLIC',
      slug: null
    });
  });

  it('refuses a team with a member who is not an e2e user, and creates nothing', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'OWNER', user: e2eUser('host') },
          { role: 'MEMBER', user: realUser() }
        ]
      })
    );

    await expect(seed({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('refuses a team with no owner', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({ members: [{ role: 'ADMIN', user: e2eUser('admin') }] })
    );

    await expect(seed({})).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED'
    });
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('expires the cache tags of the giveaway at once', async () => {
    await seed({});

    const calls = nextCacheMock.revalidateTag.mock.calls;
    expect(calls).toEqual(
      expect.arrayContaining([
        [`sweepstakes-${ID}`, { expire: 0 }],
        [`sweepstakes-${ID}-privacy`, { expire: 0 }],
        ['participant-sweepstake', { expire: 0 }],
        ['winners-leaderboard', { expire: 0 }]
      ])
    );
    expect(calls.every(([, profile]) => profile !== 'max')).toBe(true);
    expect(calls.map(([tag]) => tag)).not.toContain('public-sweepstakes-list');
  });

  it('also expires the browse lists for a PUBLIC giveaway', async () => {
    await seed({ visibility: 'PUBLIC' }, true);

    expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
      'public-sweepstakes-list',
      {
        expire: 0
      }
    );
  });

  it('returns what the test needs', async () => {
    expect(await seed({ preset: 'running', slug: 'e2e-abc123-x' })).toEqual({
      id: ID,
      name: '[e2e abc123] Giveaway',
      status: 'ACTIVE',
      preset: 'running',
      team: 'e2e-abc123-w0',
      owner: 'e2e-host-abc123@example.com',
      visibility: 'UNLISTED',
      slug: 'e2e-abc123-x',
      startDate: new Date(NOW.getTime() - HOUR),
      endDate: new Date(NOW.getTime() + 7 * DAY)
    });
  });
});
