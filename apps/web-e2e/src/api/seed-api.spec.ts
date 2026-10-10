import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../env';
import { seedApi, seedWorkerTeam } from '../helpers/seed';

const PATHS = [
  ['GET', 'health'],
  ['GET', 'rows?view=team&slug=e2e-nope'],
  ['POST', 'teams'],
  ['POST', 'sweepstakes'],
  ['POST', 'users/extras'],
  ['POST', 'integrations'],
  ['POST', 'invites'],
  ['POST', 'pickers'],
  ['GET', 'rows?view=accounts&persona=host&ns=abcdef'],
  ['POST', 'janitor'],
  ['DELETE', `runs/${RUN_ID}`],
  ['GET', 'does-not-exist']
] as const;

test.describe('seed API', { tag: '@security' }, () => {
  for (const [header, label] of [
    [undefined, 'without the secret'],
    ['x'.repeat(40), 'with a wrong secret']
  ] as const) {
    test(`hides every path from a caller ${label}`, async ({ request }) => {
      for (const [method, path] of PATHS) {
        const response = await request.fetch(`/api/e2e/${path}`, {
          method,
          headers: header ? { 'x-e2e-secret': header } : {},
          data: method === 'POST' ? {} : undefined
        });

        expect(response.status(), `${method} ${path}`).toBe(404);
        expect(await response.text(), `${method} ${path}`).toBe('');
      }
    });
  }

  test('reports the environment to a caller with the secret', async ({
    request
  }) => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

    expect(await seedApi(request).health()).toEqual({
      environment: expect.stringMatching(/^(preview|development)$/),
      writes: expect.any(Boolean),
      allowPublic: expect.any(Boolean),
      fakes: expect.any(Array)
    });
  });

  test('seeds the extras of a user, integrations, invites and a picker', async ({
    request
  }, testInfo) => {
    const api = seedApi(request);
    const health = await api.health();
    test.skip(!health?.writes, 'The seed API needs E2E_ALLOW_WRITES=1');

    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = `${RUN_ID}x${testInfo.parallelIndex}`;

    const { users } = await api.userExtras({
      ns,
      users: [
        {
          persona: 'participant',
          accounts: [{ identity: 'DISCORD' }],
          location: { country: 'Germany', countryCode: 'DE' }
        }
      ]
    });
    expect(users[0].ip).toMatch(/^2001:db8:e2e:/);
    const { accounts } = await api.rows<{ accounts: { provider: string }[] }>({
      view: 'accounts',
      persona: 'participant',
      ns
    });
    expect(accounts.map((account) => account.provider)).toEqual(['discord']);

    const { integrations } = await api.integrations({
      team: team.slug,
      integrations: [{ provider: 'TWITCH' }]
    });
    expect(integrations).toEqual([
      expect.objectContaining({ provider: 'TWITCH', status: 'ACTIVE' })
    ]);

    const invites = await api.invites({
      ns,
      team: team.slug,
      emails: [{ persona: 'member', role: 'MEMBER' }],
      link: { expiresIn: -60 }
    });
    expect(invites.emails).toEqual([
      expect.objectContaining({ email: `e2e-member-${ns}@example.com` })
    ]);
    expect(Date.parse(invites.link?.expiresAt ?? '')).toBeLessThan(Date.now());

    const picker = await api.picker({
      team: team.slug,
      users: [{ username: 'alice' }],
      draws: [{ user: 0 }]
    });
    expect(picker.draws).toEqual([
      expect.objectContaining({ userId: picker.users[0].id })
    ]);
  });
});
