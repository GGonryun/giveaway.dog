import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TeamRole, TeamTier } from '@giveaway/db-model';
import { publishTwitterV2Picker } from '../publish-twitter-v2-picker';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  NOW,
  buildFormInput,
  buildPicker,
  buildTeam
} from '../../testing/fixtures-pickers';

const DAY_MS = 24 * 60 * 60 * 1000;

type PublishInput = Parameters<typeof publishTwitterV2Picker>[0];

const input = (overrides: Partial<PublishInput> = {}): PublishInput => ({
  pickerId: 'picker-1',
  slug: 'acme',
  data: buildFormInput(),
  ...overrides
});

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

describe('publishTwitterV2Picker', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
    vi.stubEnv('CRON_SECRET', 'cron-secret');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without starting a workflow', async () => {
      const result = await publishTwitterV2Picker(input());

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(
        buildTeam({ tier: TeamTier.FREE })
      );
      prismaMock.twitterPicker.findUnique.mockResolvedValue(buildPicker());
      fetchMock.mockResolvedValue(jsonResponse({ runId: 'run-1' }));
    });

    describe('with invalid input', () => {
      it('rejects form data without post urls', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: { ...buildFormInput(), setup: { postUrls: [] } }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('At least one post URL is required');
        expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('rejects a run date in the past', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: {
                runAt: new Date(NOW.getTime() - DAY_MS).toISOString(),
                timeZone: 'UTC'
              }
            }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Run date must be in the future');
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('rejects a run date beyond the schedule window', async () => {
        const result = await publishTwitterV2Picker(
          input({
            data: {
              ...buildFormInput(),
              timing: {
                runAt: new Date(NOW.getTime() + 30 * DAY_MS).toISOString(),
                timeZone: 'UTC'
              }
            }
          })
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain('Duration cannot exceed 14 days');
      });

      it('rejects a missing slug', async () => {
        const result = await publishTwitterV2Picker({
          pickerId: 'picker-1',
          data: buildFormInput()
        } as unknown as PublishInput);

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Input validation failed: [\s\S]*"slug"/
        );
      });
    });

    describe('team and picker checks', () => {
      it('looks the team up by slug among the caller memberships', async () => {
        await publishTwitterV2Picker(input({ slug: 'dog-team' }));

        expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
          where: {
            slug: 'dog-team',
            members: { some: { userId: TEST_USER.id } }
          },
          include: { members: true }
        });
      });

      it('allows a FREE team', async () => {
        const result = await publishTwitterV2Picker(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('returns NOT_FOUND when the team does not exist', async () => {
        prismaMock.team.findUnique.mockResolvedValue(null);

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Team not found'
        );
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('returns FORBIDDEN for a guest member', async () => {
        prismaMock.team.findUnique.mockResolvedValue(
          buildTeam({ role: TeamRole.GUEST })
        );

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: UPDATE_PICKERS'
        );
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('looks the picker up within the team', async () => {
        await publishTwitterV2Picker(input({ pickerId: 'picker-42' }));

        expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
          where: { id: 'picker-42', teamId: 'team-1' }
        });
      });

      it('returns NOT_FOUND when the picker is not in the team', async () => {
        prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Picker not found'
        );
        expect(fetchMock).not.toHaveBeenCalled();
      });
    });

    describe('starting the scrape workflow', () => {
      it('posts the parsed request to the workflow start endpoint', async () => {
        await publishTwitterV2Picker(input());

        expect(fetchMock).toHaveBeenCalledWith(
          'https://giveaway.test/api/workflows/twitter/scrape/start',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer cron-secret'
            },
            body: JSON.stringify({
              pickerId: 'picker-1',
              slug: 'acme',
              data: buildFormInput()
            })
          }
        );
      });

      it('sends the form with schema defaults applied', async () => {
        await publishTwitterV2Picker(
          input({
            data: {
              setup: { postUrls: [{ url: 'https://x.com/a/status/1' }] },
              actions: {},
              winners: {},
              filters: {}
            } as unknown as PublishInput['data']
          })
        );

        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(String(init?.body)).data).toEqual({
          setup: { postUrls: [{ url: 'https://x.com/a/status/1' }] },
          actions: { repost: true, reply: false },
          winners: { quota: 1 },
          filters: {
            minimumPostCount: null,
            minimumAccountAgeDays: null,
            minimumFollowers: null,
            minimumFollowing: null,
            lastPostWithin: null,
            hasProfileImage: false,
            hasBanner: false,
            hasLocation: false,
            hasDescription: false
          }
        });
      });

      it('sends a valid future run date', async () => {
        const runAt = new Date(NOW.getTime() + DAY_MS).toISOString();

        await publishTwitterV2Picker(
          input({
            data: { ...buildFormInput(), timing: { runAt, timeZone: 'UTC' } }
          })
        );

        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(String(init?.body)).data.timing).toEqual({
          runAt,
          timeZone: 'UTC'
        });
      });

      it('builds the url and token from unset environment variables as "undefined"', async () => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
        vi.stubEnv('CRON_SECRET', undefined);

        await publishTwitterV2Picker(input());

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('undefined/api/workflows/twitter/scrape/start');
        expect(init?.headers).toEqual({
          'Content-Type': 'application/json',
          Authorization: 'Bearer undefined'
        });
      });

      it('returns success when the workflow starts', async () => {
        const result = await publishTwitterV2Picker(input());

        expect(expectOk(result)).toEqual({ success: true });
      });

      it('does not update the picker itself', async () => {
        await publishTwitterV2Picker(input());

        expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
      });
    });

    describe('when the workflow fails to start', () => {
      it('returns CONFLICT with the endpoint error message', async () => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: 'Picker already running' }, { status: 409 })
        );

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'CONFLICT').message).toBe(
          'Picker already running'
        );
      });

      it('returns CONFLICT with a default message when the endpoint gives none', async () => {
        fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'CONFLICT').message).toBe(
          'Failed to start scrape workflow'
        );
      });

      it('returns CONFLICT with a default message for an empty error', async () => {
        fetchMock.mockResolvedValue(
          jsonResponse({ error: '' }, { status: 400 })
        );

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'CONFLICT').message).toBe(
          'Failed to start scrape workflow'
        );
      });

      it('returns INTERNAL_SERVER_ERROR when the error body is not JSON', async () => {
        fetchMock.mockResolvedValue(
          new Response('<html>Bad Gateway</html>', { status: 502 })
        );

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
          /JSON/
        );
      });

      it('returns INTERNAL_SERVER_ERROR when the request itself fails', async () => {
        fetchMock.mockRejectedValue(new Error('fetch failed'));

        const result = await publishTwitterV2Picker(input());

        expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
          'fetch failed'
        );
      });
    });
  });
});
