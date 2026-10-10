import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { E2E_MAX_BODY_BYTES, handleE2eRequest } from '../router';
import { seedE2eIntegrations } from '../integrations';
import { seedE2eInvites } from '../invites';
import { seedE2ePicker } from '../pickers';
import { seedE2eSweepstakes } from '../sweepstakes';
import { seedE2eUserExtras } from '../users';
import {
  clearMemoryOutbox,
  recordE2eOutbox
} from '@giveaway/e2e-fakes/testing/outbox';
import { teamRow } from './fixtures';

vi.mock('../sweepstakes', () => ({ seedE2eSweepstakes: vi.fn() }));
vi.mock('../users', () => ({
  seedE2eUserExtras: vi.fn(),
  deleteOrphanE2eIpAddresses: vi.fn()
}));
vi.mock('../integrations', () => ({ seedE2eIntegrations: vi.fn() }));
vi.mock('../invites', () => ({ seedE2eInvites: vi.fn() }));
vi.mock('../pickers', () => ({ seedE2ePicker: vi.fn() }));
vi.mock(
  '@giveaway/e2e-fakes/outbox',
  () => import('@giveaway/e2e-fakes/testing/outbox')
);

const SECRET = 'e2e-secret-with-at-least-32-chars';

const call = (
  method: string,
  path: string,
  {
    secret = SECRET,
    body,
    headers = {}
  }: {
    secret?: string | null;
    body?: string;
    headers?: Record<string, string>;
  } = {}
) => {
  const url = `https://preview.giveaway.dog/api/e2e/${path}`;
  const request = new Request(url, {
    method,
    headers: {
      ...(secret === null ? {} : { 'x-e2e-secret': secret }),
      ...headers
    },
    body
  });
  const [pathname] = path.split('?');
  return handleE2eRequest(request, pathname.split('/'));
};

const WRITES: [string, string, string?][] = [
  ['POST', 'teams', JSON.stringify({ ns: 'abc123', suffix: 'w0' })],
  [
    'POST',
    'sweepstakes',
    JSON.stringify({ ns: 'abc123', team: 'e2e-abc123-w0' })
  ],
  [
    'POST',
    'users/extras',
    JSON.stringify({ ns: 'abc123', users: [{ persona: 'participant' }] })
  ],
  [
    'POST',
    'integrations',
    JSON.stringify({
      team: 'e2e-abc123-w0',
      integrations: [{ provider: 'TWITTER' }]
    })
  ],
  ['POST', 'invites', JSON.stringify({ ns: 'abc123', team: 'e2e-abc123-w0' })],
  ['POST', 'pickers', JSON.stringify({ team: 'e2e-abc123-w0' })],
  ['DELETE', 'runs/abc123'],
  ['POST', 'janitor']
];

const READS: [string, string][] = [
  ['GET', 'health'],
  ['GET', 'rows?view=team&slug=e2e-abc123-w0'],
  ['GET', 'outbox?channel=email&target=e2e-host-abc123@example.com']
];

const ROW_VIEWS: [string, string][] = [
  ['GET', 'rows?view=completions&id=sw-1'],
  ['GET', 'rows?view=draws&id=sw-1'],
  ['GET', 'rows?view=accounts&persona=participant&ns=abc123']
];

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('VERCEL_TARGET_ENV', 'preview');
  vi.stubEnv('E2E_LOGIN_SECRET', SECRET);
  vi.stubEnv('E2E_ALLOW_WRITES', '1');
  vi.stubEnv('E2E_ALLOW_PUBLIC', undefined);
  vi.stubEnv('E2E_FAKE_EXTERNALS', undefined);
  clearMemoryOutbox();
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  prismaMock.team.findUnique.mockResolvedValue(teamRow());
  prismaMock.team.findMany.mockResolvedValue([]);
  prismaMock.user.findMany.mockResolvedValue([]);
  prismaMock.team.upsert.mockResolvedValue({ id: 'team-1' });
  prismaMock.user.upsert.mockResolvedValue({
    id: 'user-1',
    email: 'e2e-host-abc123@example.com'
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const expectNothingTouched = () => {
  for (const model of [
    prismaMock.team,
    prismaMock.user,
    prismaMock.sweepstakes
  ]) {
    for (const method of Object.values(model)) {
      expect(method).not.toHaveBeenCalled();
    }
  }
};

describe('handleE2eRequest', () => {
  describe('the gate', () => {
    it.each([...READS, ...ROW_VIEWS, ...WRITES])(
      '%s %s returns a bare 404 without the secret',
      async (method, path, body) => {
        const response = await call(method, path, { secret: null, body });

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('');
        expectNothingTouched();
      }
    );

    it.each([
      ['a wrong secret', `${SECRET.slice(0, -1)}x`],
      ['a longer secret', `${SECRET}x`],
      ['an empty secret', '']
    ])('returns a bare 404 for %s', async (_, secret) => {
      const response = await call('GET', 'health', { secret });

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('');
    });

    it('ignores a secret in the query string', async () => {
      const response = await call('GET', `health?secret=${SECRET}`, {
        secret: null
      });

      expect(response.status).toBe(404);
    });

    it.each([
      [
        'production',
        { VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'production' }
      ],
      ['a custom environment', { VERCEL_TARGET_ENV: 'staging' }],
      ['a build outside Vercel', { VERCEL_ENV: '', VERCEL_TARGET_ENV: '' }]
    ])('returns a bare 404 with the right secret on %s', async (_, env) => {
      for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);

      for (const [method, path, body] of [...READS, ...WRITES]) {
        const response = await call(method, path, { body });

        expect(response.status).toBe(404);
        expect(await response.text()).toBe('');
      }
      expectNothingTouched();
    });

    it('returns a bare 404 when the secret is too short', async () => {
      vi.stubEnv('E2E_LOGIN_SECRET', 'short');

      const response = await call('GET', 'health', { secret: 'short' });

      expect(response.status).toBe(404);
    });
  });

  describe('routing', () => {
    it.each([
      ['GET', 'unknown'],
      ['GET', 'teams'],
      ['PUT', 'teams'],
      ['POST', 'health'],
      ['DELETE', 'runs'],
      ['DELETE', 'runs/abc123/extra'],
      ['DELETE', 'teams/abc123'],
      ['DELETE', 'janitor/abc123'],
      ['GET', '']
    ])('returns a bare 404 for %s %s', async (method, path) => {
      const response = await call(method, path);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('');
    });
  });

  describe('routes', () => {
    it('deletes the run that the path names', async () => {
      const response = await call('DELETE', 'runs/abc123');

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ runId: 'abc123' });
      expect(prismaMock.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { slug: { startsWith: 'e2e-' } },
              { slug: { startsWith: 'e2e-abc123' } }
            ]
          }
        })
      );
    });

    it('ignores a body on a DELETE', async () => {
      const response = await call('DELETE', 'runs/abc123', { body: '{ns:' });

      expect(response.status).toBe(200);
    });

    it('passes the parsed user extras to the builder', async () => {
      vi.mocked(seedE2eUserExtras).mockResolvedValue({ users: [] } as never);

      const response = await call('POST', 'users/extras', {
        body: JSON.stringify({
          ns: 'abc123',
          users: [
            { persona: 'participant', accounts: [{ identity: 'GOOGLE' }] }
          ]
        })
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ users: [] });
      expect(seedE2eUserExtras).toHaveBeenCalledWith({
        db: prismaMock,
        request: {
          ns: 'abc123',
          users: [
            {
              persona: 'participant',
              accounts: [{ identity: 'GOOGLE', status: 'ACTIVE', scopes: [] }]
            }
          ]
        },
        now: expect.any(Date)
      });
    });

    it('passes the parsed integrations to the builder', async () => {
      vi.mocked(seedE2eIntegrations).mockResolvedValue({ ok: 1 } as never);

      const response = await call('POST', 'integrations', {
        body: JSON.stringify({
          team: 'e2e-abc123-w0',
          integrations: [{ provider: 'DISCORD' }]
        })
      });

      expect(await response.json()).toEqual({ ok: 1 });
      expect(seedE2eIntegrations).toHaveBeenCalledWith({
        db: prismaMock,
        request: {
          team: 'e2e-abc123-w0',
          integrations: [{ provider: 'DISCORD', status: 'ACTIVE' }]
        }
      });
    });

    it('passes the parsed invites to the builder', async () => {
      vi.mocked(seedE2eInvites).mockResolvedValue({ ok: 1 } as never);

      const response = await call('POST', 'invites', {
        body: JSON.stringify({
          ns: 'abc123',
          team: 'e2e-abc123-w0',
          link: {}
        })
      });

      expect(await response.json()).toEqual({ ok: 1 });
      expect(seedE2eInvites).toHaveBeenCalledWith({
        db: prismaMock,
        request: {
          ns: 'abc123',
          team: 'e2e-abc123-w0',
          emails: [],
          link: { expiresIn: null }
        },
        now: expect.any(Date)
      });
    });

    it('passes the parsed picker to the builder', async () => {
      vi.mocked(seedE2ePicker).mockResolvedValue({ ok: 1 } as never);

      const response = await call('POST', 'pickers', {
        body: JSON.stringify({ team: 'e2e-abc123-w0', status: 'FAILED' })
      });

      expect(await response.json()).toEqual({ ok: 1 });
      expect(seedE2ePicker).toHaveBeenCalledWith({
        db: prismaMock,
        request: {
          team: 'e2e-abc123-w0',
          status: 'FAILED',
          winners: 1,
          users: [],
          posts: [],
          draws: []
        },
        now: expect.any(Date)
      });
    });

    it.each([
      ['off', undefined, false],
      ['on', '1', true]
    ])(
      'passes the giveaway request and the public switch (%s) to the builder',
      async (_, allowPublic, expected) => {
        vi.stubEnv('E2E_ALLOW_PUBLIC', allowPublic);
        vi.mocked(seedE2eSweepstakes)
          .mockReset()
          .mockResolvedValue({ id: 'sw-1' } as never);

        const response = await call('POST', 'sweepstakes', {
          body: JSON.stringify({ ns: 'abc123', team: 'e2e-abc123-w0' })
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: 'sw-1' });
        expect(seedE2eSweepstakes).toHaveBeenCalledWith({
          db: prismaMock,
          request: {
            ns: 'abc123',
            team: 'e2e-abc123-w0',
            preset: 'running',
            name: 'Giveaway',
            visibility: 'UNLISTED',
            tasks: [
              {
                type: 'BONUS_TASK',
                title: 'Click for a bonus entry',
                value: 1,
                mandatory: false,
                tasksRequired: 0
              }
            ],
            prizes: [{ name: 'My Custom Prize', quota: 1 }],
            entries: [],
            draws: [],
            referrals: []
          },
          now: expect.any(Date),
          allowPublic: expected
        });
      }
    );
  });

  describe('health', () => {
    it('reports the environment and the switches', async () => {
      const response = await call('GET', 'health');

      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({
        environment: 'preview',
        writes: true,
        allowPublic: false,
        fakes: []
      });
    });

    it('reports the fakes that are on', async () => {
      vi.stubEnv('E2E_FAKE_EXTERNALS', 'email,scrapebadger');

      expect(await (await call('GET', 'health')).json()).toMatchObject({
        fakes: ['email', 'scrapebadger']
      });
    });

    it('reports that writes are off', async () => {
      vi.stubEnv('E2E_ALLOW_WRITES', undefined);

      expect(await (await call('GET', 'health')).json()).toMatchObject({
        writes: false
      });
    });
  });

  describe('outbox', () => {
    const EMAIL = 'e2e-host-abc123@example.com';

    it('returns the entries of one channel and target', async () => {
      const entry = await recordE2eOutbox({
        channel: 'email',
        target: EMAIL,
        payload: { subject: 'Sign in' }
      });
      await recordE2eOutbox({
        channel: 'email',
        target: 'e2e-host-zzz999@example.com',
        payload: {}
      });

      const response = await call(
        'GET',
        `outbox?channel=email&target=${encodeURIComponent(EMAIL)}`
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ entries: [entry] });
    });

    it('reads the outbox when writes are off', async () => {
      vi.stubEnv('E2E_ALLOW_WRITES', undefined);

      const response = await call('GET', `outbox?channel=x&target=team-1`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ entries: [] });
    });

    it.each([
      ['an unknown channel', 'channel=sms&target=team-1'],
      ['no target', 'channel=email'],
      ['a target with other characters', 'channel=x&target=a%3Ab'],
      ['an unknown field', 'channel=x&target=team-1&limit=5']
    ])('refuses %s with 400', async (_, query) => {
      const response = await call('GET', `outbox?${query}`);

      expect(response.status).toBe(400);
    });
  });

  describe('the write switch', () => {
    it.each(WRITES)(
      'refuses %s %s when writes are off',
      async (method, path, body) => {
        vi.stubEnv('E2E_ALLOW_WRITES', '0');

        const response = await call(method, path, { body });

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
          error: 'Writes need E2E_ALLOW_WRITES=1',
          code: 'FORBIDDEN'
        });
        expectNothingTouched();
      }
    );

    it.each(READS)('allows %s %s when writes are off', async (method, path) => {
      vi.stubEnv('E2E_ALLOW_WRITES', undefined);

      expect((await call(method, path)).status).toBe(200);
    });
  });

  describe('input', () => {
    it('refuses a body above the size limit', async () => {
      const body = JSON.stringify({
        ns: 'abc123',
        suffix: 'w0',
        name: 'x'.repeat(E2E_MAX_BODY_BYTES)
      });

      const response = await call('POST', 'teams', { body });

      expect(response.status).toBe(413);
      expect(await response.json()).toEqual({
        error: `The body must have at most ${E2E_MAX_BODY_BYTES} bytes`,
        code: 'PAYLOAD_TOO_LARGE'
      });
      expectNothingTouched();
    });

    it('accepts a body of exactly the size limit', async () => {
      const shell = JSON.stringify({ pad: '' });
      const body = JSON.stringify({
        pad: 'x'.repeat(E2E_MAX_BODY_BYTES - shell.length)
      });

      expect(body).toHaveLength(E2E_MAX_BODY_BYTES);
      expect((await call('POST', 'janitor', { body })).status).toBe(200);
    });

    it('accepts a declared length of exactly the size limit', async () => {
      const response = await call('POST', 'janitor', {
        body: '{}',
        headers: { 'content-length': String(E2E_MAX_BODY_BYTES) }
      });

      expect(response.status).toBe(200);
    });

    it('refuses a declared length above the size limit without reading the body', async () => {
      const response = await call('POST', 'teams', {
        body: '{}',
        headers: { 'content-length': String(E2E_MAX_BODY_BYTES + 1) }
      });

      expect(response.status).toBe(413);
    });

    it('refuses a body that is not JSON', async () => {
      const response = await call('POST', 'teams', { body: '{ns:' });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: 'The body is not valid JSON',
        code: 'BAD_REQUEST'
      });
    });

    it('lists the problems of a request that does not match its schema', async () => {
      const response = await call('POST', 'teams', {
        body: JSON.stringify({
          ns: 'ABC',
          suffix: 'w0',
          email: 'victim@example.com'
        })
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('The request is not valid');
      expect(body.issues.map((issue: { path: string }) => issue.path)).toEqual(
        expect.arrayContaining(['ns', ''])
      );
      expectNothingTouched();
    });

    it('names the path of a nested problem with dots', async () => {
      const response = await call('POST', 'teams', {
        body: JSON.stringify({
          ns: 'abc123',
          suffix: 'w0',
          members: [{ persona: 'admin', role: 'OWNER' }]
        })
      });

      const body = await response.json();
      expect(body.issues.map((issue: { path: string }) => issue.path)).toEqual([
        'members.0.role'
      ]);
    });

    it('refuses a bad run id', async () => {
      const response = await call('DELETE', 'runs/abc%25');

      expect(response.status).toBe(400);
      expect(prismaMock.team.findMany).not.toHaveBeenCalled();
    });

    it('refuses a rows view that does not exist', async () => {
      const response = await call('GET', 'rows?view=users');

      expect(response.status).toBe(400);
    });
  });

  describe('errors', () => {
    it('maps an application error to its status', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const response = await call('GET', 'rows?view=team&slug=e2e-abc123-w0');

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: 'Team e2e-abc123-w0 not found',
        code: 'NOT_FOUND'
      });
    });

    it('maps a unique constraint failure to 409', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);
      prismaMock.team.upsert.mockRejectedValue(knownRequestError('P2002'));

      const response = await call('POST', 'teams', {
        body: JSON.stringify({ ns: 'abc123', suffix: 'w0' })
      });

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: 'A unique value is already taken',
        code: 'CONFLICT'
      });
    });

    it.each([
      ['another Prisma error', knownRequestError('P2025')],
      [
        'an error that only looks like a unique constraint failure',
        Object.assign(new Error('Unique'), { code: 'P2002' })
      ]
    ])('maps %s to 500', async (_, error) => {
      prismaMock.team.findMany.mockRejectedValue(error);

      expect((await call('POST', 'janitor')).status).toBe(500);
    });

    it('hides the details of an unexpected error', async () => {
      prismaMock.team.findMany.mockRejectedValue(
        new Error('connect ECONNREFUSED postgres://user:password@db')
      );

      const response = await call('POST', 'janitor');

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: 'The request failed',
        code: 'INTERNAL_SERVER_ERROR'
      });
    });

    it('maps an application error without a known status to 400', async () => {
      prismaMock.team.findMany.mockRejectedValue(
        new ApplicationError({ code: 'VALIDATION_ERROR', message: 'Bad' })
      );

      expect((await call('POST', 'janitor')).status).toBe(400);
    });
  });

  describe('the audit log', () => {
    it('writes one line per call, without the secret or the body', async () => {
      await call('POST', 'teams', {
        body: JSON.stringify({ ns: 'abc123', suffix: 'w0' })
      });

      expect(console.info).toHaveBeenCalledTimes(1);
      const [prefix, line] = vi.mocked(console.info).mock.calls[0];
      expect(prefix).toBe('[e2e]');
      expect(JSON.parse(line)).toEqual({
        method: 'POST',
        path: '/teams',
        status: 200,
        ms: expect.any(Number)
      });
      expect(line).not.toContain(SECRET);
      expect(line).not.toContain('abc123');
    });

    it('logs a refused call too', async () => {
      await call('GET', 'health', { secret: 'wrong' });

      expect(console.info).toHaveBeenCalledTimes(1);
      expect(
        JSON.parse(vi.mocked(console.info).mock.calls[0][1])
      ).toMatchObject({
        status: 404
      });
    });

    it('escapes a path that tries to forge a log line', async () => {
      await handleE2eRequest(
        new Request('https://preview.giveaway.dog/api/e2e/x', {
          method: 'GET'
        }),
        ['x\n[e2e] {"status":200}']
      );

      expect(vi.mocked(console.info).mock.calls[0][1]).not.toContain('\n');
    });
  });
});
