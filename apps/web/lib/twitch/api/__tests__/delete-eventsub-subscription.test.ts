import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  deleteAllEventSubSubscriptions,
  deleteEventSubSubscription
} from '../delete-eventsub-subscription';
import { ApplicationError } from '@giveaway/util-errors';
import { prismaMock } from '@giveaway/testing-server/prisma';
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

const routeFetch = (deleteResponse: (url: string) => Response) => {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url === TOKEN_URL) {
      return jsonResponse({ access_token: 'app-token' });
    }
    return deleteResponse(url);
  });
};

describe('delete-eventsub-subscription', () => {
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

  describe('deleteEventSubSubscription', () => {
    const args = {
      subscriptionId: 'db-sub-1',
      twitchId: 'twitch-sub-1',
      accessToken: 'app-token'
    };

    describe('when twitch deletes the subscription', () => {
      beforeEach(() => {
        fetchMock.mockResolvedValue(emptyResponse(204));
      });

      it('sends a DELETE request for the twitch subscription id', async () => {
        await deleteEventSubSubscription(args);

        expect(fetchMock).toHaveBeenCalledWith(
          `${EVENTSUB_URL}?id=twitch-sub-1`,
          {
            method: 'DELETE',
            headers: {
              Authorization: 'Bearer app-token',
              'Client-Id': 'client-id'
            }
          }
        );
      });

      it('deletes the database record by its id', async () => {
        await deleteEventSubSubscription(args);

        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'db-sub-1' }
        });
      });

      it('resolves to undefined', async () => {
        await expect(deleteEventSubSubscription(args)).resolves.toBeUndefined();
      });
    });

    describe('when twitch no longer knows the subscription', () => {
      it('treats a 404 as deleted and removes the database record', async () => {
        fetchMock.mockResolvedValue(textResponse('not found', 404));

        await deleteEventSubSubscription(args);

        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'db-sub-1' }
        });
      });
    });

    describe('when twitch fails to delete the subscription', () => {
      beforeEach(() => {
        fetchMock.mockResolvedValue(textResponse('server exploded', 500));
      });

      it('throws an INTERNAL_SERVER_ERROR application error', async () => {
        const error = await deleteEventSubSubscription(args).catch(
          (e: unknown) => e
        );

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete EventSub subscription'
        });
      });

      it('logs the error body returned by twitch', async () => {
        await deleteEventSubSubscription(args).catch(() => undefined);

        expect(console.error).toHaveBeenCalledWith(
          'EventSub subscription deletion failed:',
          'server exploded'
        );
      });

      it('keeps the database record', async () => {
        await deleteEventSubSubscription(args).catch(() => undefined);

        expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
      });
    });

    describe('when twitch rejects the deletion with a client error', () => {
      it('throws for a 401 instead of treating it like a 404', async () => {
        fetchMock.mockResolvedValue(textResponse('unauthorized', 401));

        await expect(deleteEventSubSubscription(args)).rejects.toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete EventSub subscription'
        });
        expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
      });
    });

    describe('when the database delete fails', () => {
      it('propagates the prisma error', async () => {
        fetchMock.mockResolvedValue(emptyResponse(204));
        prismaMock.eventSubSubscription.delete.mockRejectedValue(
          new Error('db down')
        );

        await expect(deleteEventSubSubscription(args)).rejects.toThrow(
          'db down'
        );
      });
    });

    describe('when the twitch client id is not configured', () => {
      it('throws before calling twitch', async () => {
        vi.resetModules();
        vi.stubEnv('TWITCH_CLIENT_ID', '');
        const isolated = await import('../delete-eventsub-subscription');
        const errors = await import('@giveaway/util-errors');

        const error = await isolated
          .deleteEventSubSubscription(args)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(errors.ApplicationError);
        expect(error).toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Twitch client ID not configured'
        });
        expect(fetchMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteAllEventSubSubscriptions', () => {
    describe('when there are no subscriptions', () => {
      it('does not request an app access token', async () => {
        await deleteAllEventSubSubscriptions([]);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
      });
    });

    describe('when there is a single subscription', () => {
      it('deletes it on twitch and in the database', async () => {
        routeFetch(() => emptyResponse(204));

        await deleteAllEventSubSubscriptions([
          eventSubRecord({ id: 'db-only', twitch_id: 'twitch-only' })
        ]);

        expect(
          fetchMock.mock.calls
            .filter(([, init]) => init?.method === 'DELETE')
            .map(([url]) => url)
        ).toEqual([`${EVENTSUB_URL}?id=twitch-only`]);
        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'db-only' }
        });
      });
    });

    describe('when there are subscriptions', () => {
      const subscriptions = [
        eventSubRecord({ id: 'db-sub-1', twitch_id: 'twitch-sub-1' }),
        eventSubRecord({ id: 'db-sub-2', twitch_id: 'twitch-sub-2' })
      ];

      it('requests a single app access token', async () => {
        routeFetch(() => emptyResponse(204));

        await deleteAllEventSubSubscriptions(subscriptions);

        const tokenCalls = fetchMock.mock.calls.filter(
          ([url]) => url === TOKEN_URL
        );
        expect(tokenCalls).toHaveLength(1);
      });

      it('deletes every subscription on twitch with the app token', async () => {
        routeFetch(() => emptyResponse(204));

        await deleteAllEventSubSubscriptions(subscriptions);

        const deleteCalls = fetchMock.mock.calls.filter(
          ([, init]) => init?.method === 'DELETE'
        );
        expect(deleteCalls).toEqual([
          [
            `${EVENTSUB_URL}?id=twitch-sub-1`,
            {
              method: 'DELETE',
              headers: {
                Authorization: 'Bearer app-token',
                'Client-Id': 'client-id'
              }
            }
          ],
          [
            `${EVENTSUB_URL}?id=twitch-sub-2`,
            {
              method: 'DELETE',
              headers: {
                Authorization: 'Bearer app-token',
                'Client-Id': 'client-id'
              }
            }
          ]
        ]);
      });

      it('deletes every database record', async () => {
        routeFetch(() => emptyResponse(204));

        await deleteAllEventSubSubscriptions(subscriptions);

        expect(prismaMock.eventSubSubscription.delete.mock.calls).toEqual([
          [{ where: { id: 'db-sub-1' } }],
          [{ where: { id: 'db-sub-2' } }]
        ]);
      });

      it('rejects when any twitch deletion fails', async () => {
        routeFetch((url) =>
          url.endsWith('twitch-sub-2')
            ? textResponse('boom', 500)
            : emptyResponse(204)
        );

        await expect(
          deleteAllEventSubSubscriptions(subscriptions)
        ).rejects.toMatchObject({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete EventSub subscription'
        });
      });

      it('still deletes the records whose twitch deletion succeeded', async () => {
        routeFetch((url) =>
          url.endsWith('twitch-sub-2')
            ? textResponse('boom', 500)
            : emptyResponse(204)
        );

        await deleteAllEventSubSubscriptions(subscriptions).catch(
          () => undefined
        );

        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledTimes(1);
        expect(prismaMock.eventSubSubscription.delete).toHaveBeenCalledWith({
          where: { id: 'db-sub-1' }
        });
      });

      it('rejects without deleting anything when the app token request fails', async () => {
        fetchMock.mockResolvedValue(textResponse('bad credentials', 400));

        await expect(
          deleteAllEventSubSubscriptions(subscriptions)
        ).rejects.toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Failed to create client_credentials token: 400'
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(prismaMock.eventSubSubscription.delete).not.toHaveBeenCalled();
      });
    });
  });
});
