import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import { createHost } from '@giveaway/testing-integration/fixtures';
import { handleE2eRequest } from '../router';

const SECRET = 'e2e-secret-with-at-least-32-chars';
const HOUR = 60 * 60 * 1000;
const PRESETS = ['draft', 'scheduled', 'running', 'ended', 'completed'];

const call = async (method: string, path: string, body?: unknown) => {
  const request = new Request(`https://preview.giveaway.test/api/e2e/${path}`, {
    method,
    headers: { 'x-e2e-secret': SECRET },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const response = await handleE2eRequest(
    request,
    path.split('?')[0].split('/')
  );
  expect(response.status).toBe(200);
  return response.json();
};

const seedRun = async (runId: string) => {
  const team = `e2e-${runId}-w0`;
  await call('POST', 'teams', {
    ns: runId,
    suffix: 'w0',
    members: [
      { persona: 'admin', role: 'ADMIN' },
      { persona: 'blocked', role: 'BLOCKED' }
    ],
    tier: 'PRO'
  });

  const giveaways: Record<string, { id: string }> = {};
  for (const preset of PRESETS) {
    giveaways[preset] = await call('POST', 'sweepstakes', {
      ns: `${runId}t1`,
      team,
      preset,
      slug: `e2e-${runId}t1-${preset}`
    });
  }

  const participant = await db.user.create({
    data: { email: `e2e-participant-${runId}t1@example.com` }
  });
  await db.sweepstakesParticipant.create({
    data: { userId: participant.id, sweepstakesId: giveaways.running.id }
  });

  const { id: teamId } = await db.team.findUniqueOrThrow({
    where: { slug: team }
  });
  const picker = await db.twitterPicker.create({
    data: {
      teamId,
      winners: 1,
      users: { create: { userId: 'x-1', username: 'x' } }
    },
    include: { users: true }
  });
  await db.twitterPickerDraw.create({
    data: { pickerId: picker.id, userId: picker.users[0].id }
  });

  return { team, teamId, ids: Object.values(giveaways).map((g) => g.id) };
};

const countRunRows = async (runId: string, ids: string[]) => ({
  teams: await db.team.count({
    where: { slug: { startsWith: `e2e-${runId}` } }
  }),
  users: await db.user.count({ where: { email: { contains: `-${runId}` } } }),
  memberships: await db.membership.count({
    where: { team: { slug: { startsWith: `e2e-${runId}` } } }
  }),
  sweepstakes: await db.sweepstakes.count({ where: { id: { in: ids } } }),
  visibility: await db.sweepstakesVisibility.count({
    where: { slug: { startsWith: `e2e-${runId}` } }
  }),
  jobs: await db.sweepstakesJob.count({
    where: { sweepstakesId: { in: ids } }
  }),
  participants: await db.sweepstakesParticipant.count({
    where: { sweepstakesId: { in: ids } }
  }),
  pickers: await db.twitterPicker.count({
    where: { team: { slug: { startsWith: `e2e-${runId}` } } }
  }),
  draws: await db.twitterPickerDraw.count({
    where: { picker: { team: { slug: { startsWith: `e2e-${runId}` } } } }
  })
});

beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('VERCEL_TARGET_ENV', 'preview');
  vi.stubEnv('E2E_LOGIN_SECRET', SECRET);
  vi.stubEnv('E2E_ALLOW_WRITES', '1');
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('the e2e seed API against a real database', () => {
  it('gives each preset the status and the jobs that the editor gives it', async () => {
    const { ids } = await seedRun('abc123');
    const [draft, scheduled, running, ended, completed] = ids;

    const read = async (id: string) => ({
      ...(await call('GET', `rows?view=sweepstakes&id=${id}`)).sweepstakes,
      jobs: (await call('GET', `rows?view=jobs&id=${id}`)).jobs
        .map(
          (job: { type: string; status: string }) => `${job.type}:${job.status}`
        )
        .sort()
    });

    expect(await read(draft)).toMatchObject({ status: 'DRAFT', jobs: [] });
    expect(await read(scheduled)).toMatchObject({
      status: 'ACTIVE',
      jobs: [
        'PROCESS_ACTIVATION:PENDING',
        'PROCESS_EXPIRATION:PENDING',
        'PROCESS_MODIFICATION:PENDING'
      ]
    });
    expect(await read(completed)).toMatchObject({
      status: 'COMPLETED',
      jobs: [
        'PROCESS_ACTIVATION:PENDING',
        'PROCESS_COMPLETION:PENDING',
        'PROCESS_EXPIRATION:PENDING',
        'PROCESS_MODIFICATION:PENDING'
      ]
    });

    const now = Date.now();
    const runningRow = await read(running);
    expect(runningRow).toMatchObject({
      status: 'ACTIVE',
      details: { name: '[e2e abc123t1] Giveaway' },
      visibility: { visibility: 'UNLISTED', slug: 'e2e-abc123t1-running' },
      team: { slug: 'e2e-abc123-w0' },
      _count: { participants: 1 }
    });
    expect(new Date(runningRow.timing.startDate).getTime()).toBeLessThan(now);
    expect(new Date(runningRow.timing.endDate).getTime()).toBeGreaterThan(now);

    const endedRow = await read(ended);
    expect(new Date(endedRow.timing.endDate).getTime()).toBeLessThan(now);
  });

  it('gives the team its tier and each persona its role', async () => {
    await seedRun('abc123');

    const { team, members } = await call(
      'GET',
      'rows?view=team&slug=e2e-abc123-w0'
    );

    expect(team.tier).toBe('PRO');
    expect(
      members
        .map((m: { email: string; role: string }) => `${m.email}:${m.role}`)
        .sort()
    ).toEqual([
      'e2e-admin-abc123@example.com:ADMIN',
      'e2e-blocked-abc123@example.com:BLOCKED',
      'e2e-host-abc123@example.com:OWNER'
    ]);
  });

  it('leaves no rows of the run after a seed-then-delete round trip', async () => {
    const { ids } = await seedRun('abc123');
    const other = await seedRun('xyz789');
    const real = await createHost();
    const sharedHost = await db.user.create({
      data: { email: 'e2e-host@example.com' }
    });

    const before = await countRunRows('abc123', ids);
    expect(Object.values(before).every((count) => count > 0)).toBe(true);

    const result = await call('DELETE', 'runs/abc123');

    expect(result).toMatchObject({
      teams: { deleted: ['e2e-abc123-w0'], refused: [] },
      sweepstakes: { deleted: 5 },
      users: { deleted: 4, refused: [] },
      more: false
    });
    expect(await countRunRows('abc123', ids)).toEqual({
      teams: 0,
      users: 0,
      memberships: 0,
      sweepstakes: 0,
      visibility: 0,
      jobs: 0,
      participants: 0,
      pickers: 0,
      draws: 0
    });
    expect(await countRunRows('xyz789', other.ids)).toEqual(before);
    expect(await db.team.count({ where: { id: real.team.id } })).toBe(1);
    expect(await db.user.count({ where: { id: real.user.id } })).toBe(1);
    expect(await db.user.count({ where: { id: sharedHost.id } })).toBe(1);
  });

  it('keeps a team of the run that has a real member', async () => {
    const { teamId } = await seedRun('abc123');
    const real = await createHost();
    await db.membership.create({
      data: { userId: real.user.id, teamId, role: 'MEMBER' }
    });

    const result = await call('DELETE', 'runs/abc123');

    expect(result.teams).toEqual({ deleted: [], refused: ['e2e-abc123-w0'] });
    expect(await db.team.count({ where: { id: teamId } })).toBe(1);
    expect(await db.user.count({ where: { id: real.user.id } })).toBe(1);
  });

  it('refuses to seed a giveaway for a team that has a real member', async () => {
    const { teamId } = await seedRun('abc123');
    const real = await createHost();
    await db.membership.create({
      data: { userId: real.user.id, teamId, role: 'MEMBER' }
    });
    const before = await db.sweepstakes.count();

    const response = await handleE2eRequest(
      new Request('https://preview.giveaway.test/api/e2e/sweepstakes', {
        method: 'POST',
        headers: { 'x-e2e-secret': SECRET },
        body: JSON.stringify({ ns: 'abc123', team: 'e2e-abc123-w0' })
      }),
      ['sweepstakes']
    );

    expect(response.status).toBe(403);
    expect(await db.sweepstakes.count()).toBe(before);
  });

  it('lets the janitor delete e2e data older than 24 hours, and nothing newer', async () => {
    const old = await seedRun('old123');
    const fresh = await seedRun('new123');
    const sharedHost = await db.user.create({
      data: { email: 'e2e-host@example.com' }
    });
    const longAgo = new Date(Date.now() - 25 * HOUR);
    await db.team.updateMany({
      where: { slug: { startsWith: 'e2e-old123' } },
      data: { createdAt: longAgo }
    });
    await db.user.updateMany({
      where: { email: { contains: '-old123' } },
      data: { createdAt: longAgo }
    });
    await db.user.update({
      where: { id: sharedHost.id },
      data: { createdAt: longAgo }
    });

    await call('POST', 'janitor');

    expect(await countRunRows('old123', old.ids)).toMatchObject({
      teams: 0,
      users: 0,
      sweepstakes: 0
    });
    expect(await countRunRows('new123', fresh.ids)).toMatchObject({
      teams: 1,
      users: 4,
      sweepstakes: 5
    });
    expect(await db.user.count({ where: { id: sharedHost.id } })).toBe(1);
  });

  it('seeds teams of the same personas at the same time', async () => {
    await Promise.all(
      ['w0', 'w1', 'w2', 'w3'].map((suffix) =>
        call('POST', 'teams', {
          ns: 'abc123',
          suffix,
          members: [{ persona: 'admin', role: 'ADMIN' }]
        })
      )
    );

    expect(
      await db.team.count({ where: { slug: { startsWith: 'e2e-abc123-' } } })
    ).toBe(4);
    expect(
      await db.user.count({ where: { email: 'e2e-host-abc123@example.com' } })
    ).toBe(1);
    expect(
      await db.membership.count({
        where: { user: { email: 'e2e-admin-abc123@example.com' } }
      })
    ).toBe(4);
  });

  it('gives a restarted worker its team back', async () => {
    const first = await call('POST', 'teams', { ns: 'abc123', suffix: 'w0' });
    const second = await call('POST', 'teams', { ns: 'abc123', suffix: 'w0' });

    expect(first.created).toBe(true);
    expect(second).toMatchObject({
      created: false,
      team: { id: first.team.id }
    });
  });
});
