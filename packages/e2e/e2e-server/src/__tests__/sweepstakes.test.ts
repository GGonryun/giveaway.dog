import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { e2eSweepstakesRequestSchema } from '@giveaway/e2e-model/requests';
import { applySweepstakesChanges } from '@giveaway/sweepstakes-access/shared';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { E2E_GIVEAWAY_BANNER, seedE2eSweepstakes } from '../sweepstakes';
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

  it('reads the new giveaway back in the shape of the editor form', async () => {
    await seed({});

    expect(prismaMock.sweepstakes.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: ID },
      include: FORM_SWEEPSTAKES_PAYLOAD
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

  it('acts as the owner when another member comes first', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({
        members: [
          { role: 'ADMIN', user: e2eUser('admin') },
          { role: 'OWNER', user: { ...e2eUser('host'), name: null as never } }
        ]
      })
    );

    await seed({});

    expect(vi.mocked(applySweepstakesChanges).mock.calls[0][0].user).toEqual(
      expect.objectContaining({
        id: 'user-host',
        name: '',
        email: 'e2e-host-abc123@example.com'
      })
    );
  });

  it('names the giveaway after the namespace and keeps the other editor values', async () => {
    await seed({ name: 'Summer', description: '<img src=x onerror=alert(1)>' });

    expect(appliedInput().setup).toEqual({
      name: '[e2e abc123] Summer',
      description: '<img src=x onerror=alert(1)>',
      banner: '/images/demo-sweepstakes-banner-2.jpg'
    });
    expect(appliedInput().audience).toBeDefined();
    expect(appliedInput().criteria).toBeDefined();
  });

  it('gives the giveaway a banner that the deployment serves', async () => {
    await seed({});

    expect(E2E_GIVEAWAY_BANNER).toMatch(/^\/images\/[^/]+\.jpg$/);
    expect(appliedInput().setup?.banner).toBe(E2E_GIVEAWAY_BANNER);
  });

  it('gives the giveaway one bonus task and one prize by default', async () => {
    await seed({});

    expect(appliedInput().tasks).toEqual([
      {
        id: expect.any(String),
        type: 'BONUS_TASK',
        title: 'Click for a bonus entry',
        value: 1,
        mandatory: false,
        tasksRequired: 0
      }
    ]);
    expect(appliedInput().prizes).toEqual([
      { id: expect.any(String), name: 'My Custom Prize', quota: 1 }
    ]);
  });

  it('gives each task and each prize of the request its own new id', async () => {
    await seed({
      tasks: [
        { type: 'SECRET_CODE', code: 'OPEN-SESAME' },
        { type: 'BONUS_TASK', title: 'Second' }
      ],
      prizes: [{ name: 'A mug' }, { name: 'A hat', quota: 3 }]
    });

    const { tasks, prizes } = appliedInput();
    expect(tasks).toEqual([
      expect.objectContaining({ type: 'SECRET_CODE', code: 'OPEN-SESAME' }),
      expect.objectContaining({ type: 'BONUS_TASK', title: 'Second' })
    ]);
    expect(prizes).toEqual([
      { id: expect.any(String), name: 'A mug', quota: 1 },
      { id: expect.any(String), name: 'A hat', quota: 3 }
    ]);
    const ids = [...(tasks ?? []), ...(prizes ?? [])].map((item) => item?.id);
    expect(ids).toEqual([
      expect.stringMatching(/^[\w-]{21}$/),
      expect.stringMatching(/^[\w-]{21}$/),
      expect.stringMatching(/^[\w-]{21}$/),
      expect.stringMatching(/^[\w-]{21}$/)
    ]);
    expect(new Set(ids).size).toBe(4);
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
      code: 'CONFLICT',
      message: 'The giveaway slug e2e-abc123-xss is already taken'
    });
    expect(prismaMock.sweepstakesVisibility.findUnique).toHaveBeenCalledWith({
      where: { slug: 'e2e-abc123-xss' },
      select: { id: true }
    });
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('does not look up a slug when the request has none', async () => {
    await seed({});

    expect(prismaMock.sweepstakesVisibility.findUnique).not.toHaveBeenCalled();
  });

  it('refuses a PUBLIC giveaway unless public giveaways are allowed', async () => {
    await expect(seed({ visibility: 'PUBLIC' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'A PUBLIC giveaway needs E2E_ALLOW_PUBLIC=1'
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
      code: 'PRECONDITION_FAILED',
      message: 'Team e2e-abc123-w0 has no owner'
    });
    expect(prismaMock.sweepstakes.create).not.toHaveBeenCalled();
  });

  it('expires the cache tags of the giveaway at once', async () => {
    await seed({});

    expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
      [`sweepstakes-${ID}`, { expire: 0 }],
      [`sweepstakes-${ID}-privacy`, { expire: 0 }],
      ['participant-sweepstake', { expire: 0 }],
      ['winners-leaderboard', { expire: 0 }]
    ]);
  });

  it('also expires the browse lists for a PUBLIC giveaway', async () => {
    await seed({ visibility: 'PUBLIC' }, true);

    expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
      [`sweepstakes-${ID}`, { expire: 0 }],
      [`sweepstakes-${ID}-privacy`, { expire: 0 }],
      ['participant-sweepstake', { expire: 0 }],
      ['winners-leaderboard', { expire: 0 }],
      ['public-sweepstakes-list', { expire: 0 }],
      ['historical-sweepstakes-list', { expire: 0 }],
      ['browse-hosts', { expire: 0 }],
      ['total-engagements', { expire: 0 }]
    ]);
  });

  it('returns what the test needs', async () => {
    const result = await seed({ preset: 'running', slug: 'e2e-abc123-x' });

    expect(result).toEqual({
      id: ID,
      name: '[e2e abc123] Giveaway',
      status: 'ACTIVE',
      preset: 'running',
      team: 'e2e-abc123-w0',
      owner: 'e2e-host-abc123@example.com',
      visibility: 'UNLISTED',
      slug: 'e2e-abc123-x',
      startDate: new Date(NOW.getTime() - HOUR),
      endDate: new Date(NOW.getTime() + 7 * DAY),
      tasks: appliedInput().tasks,
      prizes: appliedInput().prizes
    });
    expect(result.tasks).toHaveLength(1);
    expect(result.prizes).toHaveLength(1);
  });
});
