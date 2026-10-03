import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getTwitterOEmbed from '../get-twitter-oembed';
import { ApplicationError } from '@giveaway/util-errors';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const POST_URL = 'https://x.com/acme_dog/status/1234567890';
const ENCODED_POST_URL = 'https%3A%2F%2Fx.com%2Facme_dog%2Fstatus%2F1234567890';

const oembed = {
  url: 'https://twitter.com/acme_dog/status/1234567890',
  author_name: 'Acme Dog',
  author_url: 'https://twitter.com/acme_dog',
  html: '<blockquote class="twitter-tweet">hello</blockquote>',
  width: 550,
  height: null,
  type: 'rich',
  cache_age: '3153600000',
  provider_name: 'Twitter',
  provider_url: 'https://twitter.com',
  version: '1.0'
};

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

describe('getTwitterOEmbed', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('when the input is invalid', () => {
    it('rejects a post url that is not a url', async () => {
      const result = await getTwitterOEmbed({
        postUrl: 'tweet-123',
        theme: 'dark'
      });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an unknown theme', async () => {
      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'blue'
      } as unknown as Parameters<typeof getTwitterOEmbed>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when twitter responds successfully', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse(oembed));
    });

    it('does not require a session', async () => {
      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(result.ok).toBe(true);
    });

    it('defaults to the dark theme', async () => {
      await getTwitterOEmbed({
        postUrl: POST_URL
      } as unknown as Parameters<typeof getTwitterOEmbed>[0]);

      expect(fetchMock).toHaveBeenCalledWith(
        `https://publish.twitter.com/oembed?url=${ENCODED_POST_URL}&theme=dark`,
        { headers: { 'User-Agent': 'giveaway.dog/1.0' } }
      );
    });

    it('passes the light theme through', async () => {
      await getTwitterOEmbed({ postUrl: POST_URL, theme: 'light' });

      expect(fetchMock).toHaveBeenCalledWith(
        `https://publish.twitter.com/oembed?url=${ENCODED_POST_URL}&theme=light`,
        { headers: { 'User-Agent': 'giveaway.dog/1.0' } }
      );
    });

    it('returns the embed html, author details and canonical url', async () => {
      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectOk(result)).toEqual({
        html: '<blockquote class="twitter-tweet">hello</blockquote>',
        authorName: 'Acme Dog',
        authorUrl: 'https://twitter.com/acme_dog',
        url: 'https://twitter.com/acme_dog/status/1234567890'
      });
    });

    it('returns the same data for a signed in caller', async () => {
      signIn();

      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectOk(result).authorName).toBe('Acme Dog');
    });
  });

  describe('when twitter cannot be reached', () => {
    it('returns BAD_GATEWAY with the generic preview message for a non-ok response', async () => {
      fetchMock.mockResolvedValue(new Response('gone', { status: 404 }));

      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load tweet preview'
      );
    });

    it('logs the inner non-ok error before replacing it', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      fetchMock.mockResolvedValue(new Response('gone', { status: 403 }));

      await getTwitterOEmbed({ postUrl: POST_URL, theme: 'dark' });

      const [label, err] = consoleError.mock.calls[0];
      expect(label).toBe('Error fetching Twitter oEmbed:');
      expect(err).toBeInstanceOf(ApplicationError);
      expect(err).toMatchObject({
        code: 'BAD_GATEWAY',
        message: 'Failed to fetch tweet from Twitter'
      });
    });

    it('returns BAD_GATEWAY for a non-ok response even when the body is valid oembed json', async () => {
      fetchMock.mockResolvedValue(jsonResponse(oembed, { status: 500 }));

      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load tweet preview'
      );
    });

    it('returns BAD_GATEWAY when fetch rejects', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load tweet preview'
      );
    });

    it('returns BAD_GATEWAY when the body is not json', async () => {
      fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));

      const result = await getTwitterOEmbed({
        postUrl: POST_URL,
        theme: 'dark'
      });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load tweet preview'
      );
    });
  });

  describe('when the oembed payload is incomplete', () => {
    it.each(['html', 'author_name', 'author_url', 'url'])(
      'returns UNPROCESSABLE_CONTENT when %s is missing',
      async (field) => {
        fetchMock.mockResolvedValue(
          jsonResponse({ ...oembed, [field]: undefined })
        );

        const result = await getTwitterOEmbed({
          postUrl: POST_URL,
          theme: 'dark'
        });

        expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
          /^Output validation failed: /
        );
      }
    );
  });
});
