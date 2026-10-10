import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import { createHost } from '@giveaway/testing-integration/fixtures';
import { expectOk } from '@giveaway/testing-server/result';
import { signIn, signOut } from '@giveaway/testing-server/session';
import { E2E_MAX_TASKS, E2E_TASK_TYPES } from '@giveaway/e2e-model/requests';
import getParticipantSweepstake from '@giveaway/participation-server/get-participant-sweepstake';
import { getOrCreateSweepstakesParticipant } from '@giveaway/participation-server/get-sweepstake-participant';
import { getSweepstakesPrivacy } from '@giveaway/participation-server/get-sweepstakes-privacy';
import { handleE2eRequest } from '../router';

const SECRET = 'e2e-secret-with-at-least-32-chars';
const HOUR = 60 * 60 * 1000;
const PRESETS = ['draft', 'scheduled', 'running', 'ended', 'completed'];
const DERIVED_STATUS: Record<string, string> = {
  draft: 'DRAFT',
  scheduled: 'SCHEDULED',
  running: 'RUNNING',
  ended: 'EXPIRED',
  completed: 'COMPLETED'
};
const REQUIRED_TASK_FIELDS: Record<string, object> = {
  VISIT_URL: { href: 'https://example.com/' },
  ASK_QUESTION: { question: 'Why?' },
  SINGLE_CHOICE: { question: 'Which one?' },
  MULTIPLE_CHOICE: { question: 'Which ones?' }
};

const ENTRIES_REQUEST = {
  tasks: [{ type: 'BONUS_TASK' }, { type: 'REFERRAL_LINK' }],
  prizes: [{ name: 'A mug' }],
  terms: { type: 'CUSTOM', text: '<img src=x onerror=alert(1)>' },
  criteria: { minQualityScore: 0, allowUserSelection: true },
  audience: {
    allowedIdentities: ['ANONYMOUS'],
    regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' },
    formFields: [{ type: 'EMAIL', label: 'Your email' }]
  },
  entries: [
    {
      persona: 'participant2',
      completions: [{ task: 0 }, { task: 1, status: 'PENDING' }],
      formValues: [{ field: 0, value: 'p2@example.com' }],
      quality: 90,
      prize: 0
    },
    {
      persona: 'newbie',
      completions: [{ task: 0, status: 'REJECTED', reason: 'Bot' }]
    }
  ],
  draws: [
    { entry: 1, prize: 0, result: 'DISQUALIFIED', reason: 'Bot' },
    { entry: 0, prize: 0, previous: 0 }
  ],
  referrals: [{ entry: 0, task: 1, referred: [1] }]
};

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

const SECRET_CODE_FIELDS = ['code', 'codes'];

const withoutSecretCodes = (task: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(task).filter(([key]) => !SECRET_CODE_FIELDS.includes(key))
  );

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

  giveaways.entries = await call('POST', 'sweepstakes', {
    ns: `${runId}t1`,
    team,
    preset: 'completed',
    ...ENTRIES_REQUEST
  });

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

const loadGiveawayPage = async (sweepstakesId: string) => {
  const giveaway = expectOk(await getParticipantSweepstake({ sweepstakesId }));
  expect(expectOk(await getSweepstakesPrivacy({ sweepstakesId }))).toBe(true);
  return giveaway;
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
  }),
  completions: await db.taskCompletion.count({
    where: { task: { sweepstakesId: { in: ids } } }
  }),
  prizeDraws: await db.prizeDraw.count({
    where: { prize: { sweepstakesId: { in: ids } } }
  }),
  formValues: await db.sweepstakesFormValue.count({
    where: { participant: { sweepstakesId: { in: ids } } }
  }),
  allocations: await db.sweepstakesAllocation.count({
    where: { participant: { sweepstakesId: { in: ids } } }
  }),
  referrals: await db.referral.count({
    where: { task: { sweepstakesId: { in: ids } } }
  }),
  referredUsers: await db.referredUser.count({
    where: { user: { email: { contains: `-${runId}` } } }
  }),
  qualities: await db.userQuality.count({
    where: { user: { email: { contains: `-${runId}` } } }
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

  it('gives each preset a giveaway whose page loads for a visitor and for a participant', async () => {
    const { ids } = await seedRun('abc123');
    const participant = await db.user.create({
      data: { email: 'e2e-guest-abc123t1@example.com' }
    });

    for (const [index, preset] of PRESETS.entries()) {
      const sweepstakesId = ids[index];
      signOut();
      const visitor = await loadGiveawayPage(sweepstakesId);

      expect(visitor, preset).toMatchObject({
        sweepstakes: {
          id: sweepstakesId,
          status: DERIVED_STATUS[preset],
          setup: { banner: '/images/demo-sweepstakes-banner-2.jpg' },
          tasks: [{ type: 'BONUS_TASK', title: 'Click for a bonus entry' }],
          prizes: [{ name: 'My Custom Prize', quota: 1 }]
        },
        host: { slug: 'e2e-abc123-w0' },
        prizes: [{ prizeName: 'My Custom Prize', quota: 1, draws: [] }]
      });

      signIn({ id: participant.id, email: participant.email });
      expect(await loadGiveawayPage(sweepstakesId), preset).toEqual(visitor);
      expect(
        expectOk(await getOrCreateSweepstakesParticipant({ sweepstakesId })),
        preset
      ).toMatchObject({ user: { id: participant.id }, completions: [] });
    }
  });

  it('stores each task type and prize of the request so that the giveaway page reads them back', async () => {
    await call('POST', 'teams', { ns: 'abc123', suffix: 'w0' });
    const groups = [
      E2E_TASK_TYPES.slice(0, E2E_MAX_TASKS),
      E2E_TASK_TYPES.slice(E2E_MAX_TASKS)
    ];

    for (const types of groups) {
      const seeded = await call('POST', 'sweepstakes', {
        ns: 'abc123',
        team: 'e2e-abc123-w0',
        tasks: types.map((type) => ({ type, ...REQUIRED_TASK_FIELDS[type] })),
        prizes: [{ name: 'A mug', quota: 2 }, { name: 'A hat' }]
      });

      const { sweepstakes, prizes } = await loadGiveawayPage(seeded.id);

      expect(sweepstakes.tasks).toEqual(seeded.tasks.map(withoutSecretCodes));
      expect(sweepstakes.tasks.map((task) => task.type)).toEqual(types);
      expect(sweepstakes.prizes).toEqual(seeded.prizes);
      expect(prizes.map(({ prizeName, quota }) => [prizeName, quota])).toEqual([
        ['A mug', 2],
        ['A hat', 1]
      ]);
    }
  });

  it('stores the entries, draws and referrals of the request so that the app reads them back', async () => {
    await call('POST', 'teams', { ns: 'abc123', suffix: 'w0' });
    const seeded = await call('POST', 'sweepstakes', {
      ns: 'abc123t1',
      team: 'e2e-abc123-w0',
      preset: 'completed',
      ...ENTRIES_REQUEST
    });
    const [p2, newbie] = seeded.entries;
    const [prize] = seeded.prizes;
    const [field] = seeded.formFields;

    expect(seeded.entries).toMatchObject([
      {
        persona: 'participant2',
        email: 'e2e-participant2-abc123t1@example.com'
      },
      { persona: 'newbie', email: 'e2e-newbie-abc123t1@example.com' }
    ]);

    const page = await loadGiveawayPage(seeded.id);
    expect(page.sweepstakes).toMatchObject({
      status: 'COMPLETED',
      terms: { type: 'CUSTOM', text: '<img src=x onerror=alert(1)>' },
      criteria: { minQualityScore: 0, allowUserSelection: true },
      audience: {
        allowedIdentities: ['ANONYMOUS'],
        regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' },
        formFields: [{ id: field.id, type: 'EMAIL', label: 'Your email' }]
      }
    });
    expect(page.participation).toMatchObject({
      totalUsers: 2,
      totalEntries: 3
    });
    expect(
      page.prizes[0].draws.map((draw) => [draw.id, draw.result, draw.user.id])
    ).toEqual([
      [seeded.draws[0].id, 'DISQUALIFIED', newbie.userId],
      [seeded.draws[1].id, 'WINNER', p2.userId]
    ]);
    expect(
      await db.prizeDraw.findUniqueOrThrow({
        where: { id: seeded.draws[1].id }
      })
    ).toMatchObject({ previousDrawId: seeded.draws[0].id, prizeId: prize.id });

    expect(
      await db.taskCompletion.findMany({
        where: {
          participantId: { in: [p2.participantId, newbie.participantId] }
        },
        select: {
          participantId: true,
          taskId: true,
          status: true,
          reason: true
        },
        orderBy: [{ status: 'asc' }]
      })
    ).toEqual(
      expect.arrayContaining([
        {
          participantId: p2.participantId,
          taskId: seeded.tasks[0].id,
          status: 'COMPLETED',
          reason: null
        },
        {
          participantId: p2.participantId,
          taskId: seeded.tasks[1].id,
          status: 'PENDING',
          reason: null
        },
        {
          participantId: newbie.participantId,
          taskId: seeded.tasks[0].id,
          status: 'REJECTED',
          reason: 'Bot'
        }
      ])
    );
    expect(
      await db.sweepstakesFormValue.findMany({
        select: { participantId: true, fieldId: true, value: true }
      })
    ).toEqual([
      {
        participantId: p2.participantId,
        fieldId: field.id,
        value: 'p2@example.com'
      }
    ]);
    expect(
      await db.sweepstakesAllocation.findMany({
        select: { participantId: true, prizeId: true }
      })
    ).toEqual([{ participantId: p2.participantId, prizeId: prize.id }]);
    expect(
      await db.userQuality.findMany({ select: { userId: true, score: true } })
    ).toEqual([{ userId: p2.userId, score: 90 }]);
    expect(
      await db.referral.findMany({
        select: {
          code: true,
          participantId: true,
          taskId: true,
          referredUsers: { select: { userId: true } }
        }
      })
    ).toEqual([
      {
        code: seeded.referrals[0].code,
        participantId: p2.participantId,
        taskId: seeded.tasks[1].id,
        referredUsers: [{ userId: newbie.userId }]
      }
    ]);

    signIn({ id: newbie.userId, email: newbie.email });
    expect(
      expectOk(
        await getOrCreateSweepstakesParticipant({ sweepstakesId: seeded.id })
      )
    ).toMatchObject({
      id: newbie.participantId,
      user: { id: newbie.userId },
      completions: [{ status: 'REJECTED' }]
    });
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
      sweepstakes: { deleted: 6 },
      users: { deleted: 6, refused: [] },
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
      draws: 0,
      completions: 0,
      prizeDraws: 0,
      formValues: 0,
      allocations: 0,
      referrals: 0,
      referredUsers: 0,
      qualities: 0
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
      users: 6,
      sweepstakes: 6
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
