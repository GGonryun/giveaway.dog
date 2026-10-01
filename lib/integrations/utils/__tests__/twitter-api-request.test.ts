import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z, ZodError } from 'zod';
import { twitterApiRequest } from '../twitter-api-request';
import { ApplicationError } from '@/lib/errors';
import { prismaMock, asPrismaClient } from '@/test/prisma';
import {
  NOW,
  NOW_SECONDS,
  buildIntegration,
  jsonResponse,
  textResponse,
  captureError,
  fetchCall
} from './fixtures-integrations-utils';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const ENDPOINT = 'https://api.x.com/2/users/me';

const userSchema = z.object({
  data: z.object({ id: z.string(), username: z.string() })
});

const userPayload = { data: { id: '42', username: 'giveawaydog' } };

const fetchMock = vi.fn<typeof fetch>();

type RequestOptions = Parameters<typeof twitterApiRequest>[0];

const request = (overrides: Partial<RequestOptions> = {}) =>
  twitterApiRequest({
    tx: asPrismaClient(),
    teamId: 'team-1',
    endpoint: ENDPOINT,
    responseSchema: userSchema,
    ...overrides
  });

describe('twitterApiRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.integration.findFirst.mockResolvedValue(
      buildIntegration({ access_token: 'stored-access-token' })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('when resolving the access token', () => {
    it('looks up the twitter integration of the team and the given integration id', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request({ integrationId: 'integration-9' });

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { id: 'integration-9', teamId: 'team-1', provider: 'TWITTER' }
      });
    });

    it('looks up any twitter integration of the team when no id is given', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request();

      expect(prismaMock.integration.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-1', provider: 'TWITTER' }
      });
    });

    it('propagates token errors without calling the twitter api', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(null);

      const error = await captureError(request());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Twitter integration not found'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('uses a freshly refreshed token for the api call', async () => {
      prismaMock.integration.findFirst.mockResolvedValue(
        buildIntegration({ expires_at: NOW_SECONDS - 1 })
      );
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ access_token: 'refreshed-token', expires_in: 7200 })
        )
        .mockResolvedValueOnce(jsonResponse(userPayload));

      await request();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://api.x.com/2/oauth2/token'
      );
      expect(fetchMock.mock.calls[1][1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer refreshed-token'
          })
        })
      );
    });
  });

  describe('when building the request', () => {
    it('sends a GET with bearer auth and a JSON content type by default', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request();

      const { url, init } = fetchCall(fetchMock);
      expect(url).toBe(ENDPOINT);
      expect(init).toEqual({
        method: 'GET',
        headers: {
          Authorization: 'Bearer stored-access-token',
          'Content-Type': 'application/json'
        },
        body: undefined
      });
    });

    it('appends the query params to the endpoint', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request({
        params: new URLSearchParams({
          'user.fields': 'id,username',
          max_results: '100'
        })
      });

      expect(fetchCall(fetchMock).url).toBe(
        `${ENDPOINT}?user.fields=id%2Cusername&max_results=100`
      );
    });

    it('appends a bare question mark for empty query params', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request({ params: new URLSearchParams() });

      expect(fetchCall(fetchMock).url).toBe(`${ENDPOINT}?`);
    });

    it('sends the body as JSON with the requested method', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request({
        method: 'POST',
        body: { text: 'hello world', reply: { in_reply_to_tweet_id: '1' } }
      });

      const { init } = fetchCall(fetchMock);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        Authorization: 'Bearer stored-access-token',
        'Content-Type': 'application/json'
      });
      expect(init.body).toBe(
        '{"text":"hello world","reply":{"in_reply_to_tweet_id":"1"}}'
      );
    });

    it('omits a falsy body', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));

      await request({ method: 'POST', body: '' });

      expect(fetchCall(fetchMock).init.body).toBeUndefined();
    });

    it('sends form data as-is without a content type header', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));
      const formData = new FormData();
      formData.append('media_category', 'tweet_image');

      await request({ method: 'POST', formData });

      const { init } = fetchCall(fetchMock);
      expect(init.headers).toEqual({
        Authorization: 'Bearer stored-access-token'
      });
      expect(init.body).toBe(formData);
    });

    it('prefers form data over a JSON body when both are given', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userPayload));
      const formData = new FormData();

      await request({ method: 'POST', formData, body: { ignored: true } });

      expect(fetchCall(fetchMock).init.body).toBe(formData);
    });
  });

  describe('when twitter responds successfully', () => {
    it('returns the response parsed by the schema', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          data: { id: '42', username: 'giveawaydog', extra: 'dropped' },
          meta: { result_count: 1 }
        })
      );

      const result = await request();

      expect(result).toEqual(userPayload);
    });

    it('returns the transformed output of the schema', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: '7' }));

      const result = await request({
        responseSchema: z.object({ count: z.coerce.number() })
      });

      expect(result).toEqual({ count: 7 });
    });

    it('throws BAD_REQUEST with the zod error when the response does not match the schema', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { id: 42 } }));

      const error = await captureError(request());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid response format from Twitter'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('logs schema validation failures', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: null }));

      await captureError(request());

      expect(console.error).toHaveBeenCalledWith(
        '[twitterApiRequest] Schema validation failed:',
        expect.any(ZodError)
      );
    });

    it('rejects with the JSON parse error when the body is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('not json', 200));

      const error = await captureError(request());

      expect(error).toBeInstanceOf(SyntaxError);
    });
  });

  describe('when twitter rate limits the request', () => {
    const rateLimited = (headers: Record<string, string>) =>
      jsonResponse(
        { title: 'Too Many Requests', status: 429 },
        { status: 429, headers }
      );

    it('throws TOO_MANY_REQUESTS with the reset time from the headers', async () => {
      fetchMock.mockResolvedValue(
        rateLimited({ 'x-rate-limit-reset': String(NOW_SECONDS + 600) })
      );

      const error = await captureError(request());

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'TOO_MANY_REQUESTS',
        message: 'Twitter API rate limit exceeded',
        cause: '{"title":"Too Many Requests","status":429}',
        data: {
          retryAfter: (NOW_SECONDS + 600) * 1000,
          retryAfterISO: '2026-01-01T00:10:00.000Z'
        }
      });
    });

    it('defaults the retry time to fifteen minutes from now without a reset header', async () => {
      fetchMock.mockResolvedValue(rateLimited({}));

      const error = await captureError(request());

      expect(error).toMatchObject({
        code: 'TOO_MANY_REQUESTS',
        data: {
          retryAfter: NOW.getTime() + 15 * 60 * 1000,
          retryAfterISO: '2026-01-01T00:15:00.000Z'
        }
      });
    });

    it('logs the rate limit headers', async () => {
      fetchMock.mockResolvedValue(
        rateLimited({
          'x-rate-limit-reset': String(NOW_SECONDS + 600),
          'x-rate-limit-limit': '75',
          'x-rate-limit-remaining': '0'
        })
      );

      await captureError(request());

      expect(console.warn).toHaveBeenCalledWith(
        `Twitter API Error: ${ENDPOINT} - Status: 429`
      );
      expect(console.warn).toHaveBeenCalledWith(
        '[twitterApiRequest] Rate limit details:',
        {
          resetTime: new Date('2026-01-01T00:10:00.000Z'),
          rateLimit: '75',
          rateLimitRemaining: '0',
          retryAfter: '2026-01-01T00:10:00.000Z',
          error: { title: 'Too Many Requests', status: 429 }
        }
      );
    });

    it('logs null rate limit details when the headers are missing', async () => {
      fetchMock.mockResolvedValue(rateLimited({}));

      await captureError(request());

      expect(console.warn).toHaveBeenCalledWith(
        '[twitterApiRequest] Rate limit details:',
        {
          resetTime: null,
          rateLimit: null,
          rateLimitRemaining: null,
          retryAfter: '2026-01-01T00:15:00.000Z',
          error: { title: 'Too Many Requests', status: 429 }
        }
      );
    });

    it('rejects with a RangeError when the reset header is not numeric', async () => {
      fetchMock.mockResolvedValue(
        rateLimited({ 'x-rate-limit-reset': 'soon' })
      );

      const error = await captureError(request());

      expect(error).toBeInstanceOf(RangeError);
      expect(error).toMatchObject({ message: 'Invalid time value' });
    });

    it('rejects with the JSON parse error when the rate limit body is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('slow down', 429));

      const error = await captureError(request());

      expect(error).toBeInstanceOf(SyntaxError);
    });
  });

  describe('when twitter returns another error status', () => {
    it.each([400, 401, 403, 404, 500, 503])(
      'throws BAD_REQUEST with the response text for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(
          textResponse('{"title":"Forbidden"}', status)
        );

        const error = await captureError(request());

        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Failed to fetch data from Twitter API',
          cause: '{"title":"Forbidden"}'
        });
      }
    );

    it('logs the failing url, status and response text', async () => {
      fetchMock.mockResolvedValue(textResponse('Forbidden', 403));

      await captureError(
        request({ params: new URLSearchParams({ max_results: '5' }) })
      );

      expect(console.warn).toHaveBeenCalledWith(
        `Twitter API Error: ${ENDPOINT}?max_results=5 - Status: 403`
      );
      expect(console.error).toHaveBeenCalledWith(
        '[twitterApiRequest] Error response:',
        'Forbidden'
      );
    });
  });

  describe('when the request cannot be sent', () => {
    it('propagates the network error', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const error = await captureError(request());

      expect(error).toBeInstanceOf(TypeError);
      expect(error).toMatchObject({ message: 'fetch failed' });
    });
  });
});
