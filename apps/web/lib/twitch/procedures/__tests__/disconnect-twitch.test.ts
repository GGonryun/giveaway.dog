import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { disconnectTwitch } from '../disconnect-twitch';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  EVENTSUB_URL,
  TOKEN_URL,
  emptyResponse,
  eventSubRecord,
  jsonResponse,
  textResponse
} from '@/lib/twitch/__tests__/fixtures-twitch';

vi.hoisted(() => {
  vi.stubEnv('TWITCH_CLIENT_ID', 'client-id');
  vi.stubEnv('TWITCH_CLIENT_SECRET', 'client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

const routeFetch = (deleteResponse: () => Response) => {
  fetchMock.mockImplementation(async (input) => {
    if (String(input) === TOKEN_URL) {
      return jsonResponse({ access_token: 'app-token' });
    }
    return deleteResponse();
  });
};

const integration = (subscriptions: unknown) => ({
  id: 'integration-1',
  teamId: 'team-1',
  provider: 'TWITCH',
  subscriptions
});

describe('disconnectTwitch', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without looking up the team', async () => {
      const result = await disconnectTwitch({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT', async () => {
      signIn();

      const result = await disconnectTwitch({
        slug: 1
      } as unknown as Parameters<typeof disconnectTwitch>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the team is not found', () => {
    it('returns NOT_FOUND without looking up the integration', async () => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await disconnectTwitch({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller belongs to the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue({
        id: 'team-1',
        slug: 'acme'
      });
    });

    it('looks up the team by slug for the signed in member', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await disconnectTwitch({ slug: 'acme' });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } }
      });
    });

    it('looks up the twitch integration of the team with its subscriptions', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      await disconnectTwitch({ slug: 'acme' });

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'TWITCH' },
        include: { subscriptions: true }
      });
    });

    describe('and there is no twitch integration', () => {
      it('returns NOT_FOUND without deleting anything', async () => {
        prismaMock.integration.findFirst.mockResolvedValue(null);

        const result = await disconnectTwitch({ slug: 'acme' });

        expect(expectFailure(result, 'NOT_FOUND').message).toBe(
          'Twitch integration not found'
        );
        expect(prismaMock.integration.delete).not.toHaveBeenCalled();
      });
    });

    describe.each([
      ['an empty subscription list', []],
      ['no subscription list', undefined]
    ])('and the integration has %s', (_, subscriptions) => {
      beforeEach(() => {
        prismaMock.integration.findFirst.mockResolvedValue(
          integration(subscriptions)
        );
      });

      it('does not call twitch', async () => {
        await disconnectTwitch({ slug: 'acme' });

        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('deletes the integration and returns success', async () => {
        const result = await disconnectTwitch({ slug: 'acme' });

        expect(expectOk(result)).toEqual({ success: true });
        expect(prismaMock.integration.delete).toHaveBeenCalledWith({
          where: { id: 'integration-1' }
        });
      });
    });

    describe('and the integration has a single subscription', () => {
      it('deletes the subscription record as well as the integration', async () => {
        prismaMock.integration.findFirst.mockResolvedValue(
          integration([
            eventSubRecord({ id: 'db-only', twitch_id: 'twitch-only' })
          ])
        );
        routeFetch(() => emptyResponse(204));

        await disconnectTwitch({ slug: 'acme' });

        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'db-only' }
        });
        expect(prismaMock.integration.delete).toHaveBeenCalledWith({
          where: { id: 'integration-1' }
        });
      });
    });

    describe('and the integration has subscriptions', () => {
      beforeEach(() => {
        prismaMock.integration.findFirst.mockResolvedValue(
          integration([
            eventSubRecord({ id: 'db-sub-1', twitch_id: 'twitch-sub-1' }),
            eventSubRecord({ id: 'db-sub-2', twitch_id: 'twitch-sub-2' })
          ])
        );
      });

      it('deletes every subscription on twitch', async () => {
        routeFetch(() => emptyResponse(204));

        await disconnectTwitch({ slug: 'acme' });

        expect(
          fetchMock.mock.calls
            .filter(([, init]) => init?.method === 'DELETE')
            .map(([url]) => url)
        ).toEqual([
          `${EVENTSUB_URL}?id=twitch-sub-1`,
          `${EVENTSUB_URL}?id=twitch-sub-2`
        ]);
      });

      it('deletes every subscription record', async () => {
        routeFetch(() => emptyResponse(204));

        await disconnectTwitch({ slug: 'acme' });

        expect(prismaMock.eventSubSubscription.delete.mock.calls).toEqual([
          [{ where: { id: 'db-sub-1' } }],
          [{ where: { id: 'db-sub-2' } }]
        ]);
      });

      it('deletes the integration after the subscriptions', async () => {
        routeFetch(() => emptyResponse(204));

        const result = await disconnectTwitch({ slug: 'acme' });

        expect(expectOk(result)).toEqual({ success: true });
        expect(
          prismaMock.integration.delete.mock.invocationCallOrder[0]
        ).toBeGreaterThan(
          prismaMock.eventSubSubscription.delete.mock.invocationCallOrder[1]
        );
      });

      describe('when deleting the subscriptions fails', () => {
        beforeEach(() => {
          routeFetch(() => textResponse('boom', 500));
        });

        it('still deletes the integration and returns success', async () => {
          const result = await disconnectTwitch({ slug: 'acme' });

          expect(expectOk(result)).toEqual({ success: true });
          expect(prismaMock.integration.delete).toHaveBeenCalledWith({
            where: { id: 'integration-1' }
          });
        });

        it('logs the failure', async () => {
          await disconnectTwitch({ slug: 'acme' });

          expect(console.error).toHaveBeenCalledWith(
            'Failed to delete EventSub subscriptions:',
            expect.objectContaining({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to delete EventSub subscription'
            })
          );
        });
      });
    });

    describe('when deleting the integration fails', () => {
      it('maps a missing record to NOT_FOUND', async () => {
        prismaMock.integration.findFirst.mockResolvedValue(integration([]));
        prismaMock.integration.delete.mockRejectedValue(
          knownRequestError('P2025')
        );

        const result = await disconnectTwitch({ slug: 'acme' });

        expectFailure(result, 'NOT_FOUND');
      });
    });
  });
});
