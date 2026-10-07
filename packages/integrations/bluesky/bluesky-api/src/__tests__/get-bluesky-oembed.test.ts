import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getBlueskyOEmbed from '../get-bluesky-oembed';
import { ApplicationError } from '@giveaway/util-errors';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const POST_URL = 'https://bsky.app/profile/acme.bsky.social/post/3kabc123';

const oembed = {
  type: 'rich',
  version: '1.0',
  author_name: 'Acme Dog',
  author_url: 'https://bsky.app/profile/did:plc:acme',
  provider_name: 'Bluesky Social',
  provider_url: 'https://bsky.app',
  cache_age: 86400,
  url: POST_URL,
  html: '<blockquote class="bluesky-embed">hello</blockquote>'
};

const fetchMock = vi.fn<typeof fetch>();

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

describe('getBlueskyOEmbed', () => {
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
      const result = await getBlueskyOEmbed({ postUrl: 'not a url' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when bluesky responds successfully', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse(oembed));
    });

    it('does not require a session', async () => {
      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(result.ok).toBe(true);
    });

    it('requests the oembed endpoint with the encoded post url', async () => {
      await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://embed.bsky.app/oembed?url=https%3A%2F%2Fbsky.app%2Fprofile%2Facme.bsky.social%2Fpost%2F3kabc123'
      );
    });

    it('returns the embed html and author details', async () => {
      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectOk(result)).toEqual({
        html: '<blockquote class="bluesky-embed">hello</blockquote>',
        authorName: 'Acme Dog',
        authorUrl: 'https://bsky.app/profile/did:plc:acme'
      });
    });

    it('returns the same data for a signed in caller', async () => {
      signIn();

      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectOk(result).authorName).toBe('Acme Dog');
    });
  });

  describe('when bluesky cannot be reached', () => {
    it('returns BAD_GATEWAY with the generic preview message for a non-ok response', async () => {
      fetchMock.mockResolvedValue(new Response('missing', { status: 404 }));

      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load Bluesky post preview'
      );
    });

    it('logs the inner non-ok error before replacing it', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      fetchMock.mockResolvedValue(new Response('missing', { status: 500 }));

      await getBlueskyOEmbed({ postUrl: POST_URL });

      const [label, err] = consoleError.mock.calls[0];
      expect(label).toBe('Error fetching Bluesky oEmbed:');
      expect(err).toBeInstanceOf(ApplicationError);
      expect(err).toMatchObject({
        code: 'BAD_GATEWAY',
        message: 'Failed to fetch post from Bluesky'
      });
    });

    it('returns BAD_GATEWAY for a non-ok response even when the body is valid oembed json', async () => {
      fetchMock.mockResolvedValue(jsonResponse(oembed, { status: 404 }));

      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load Bluesky post preview'
      );
    });

    it('returns BAD_GATEWAY when fetch rejects', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load Bluesky post preview'
      );
    });

    it('returns BAD_GATEWAY when the body is not json', async () => {
      fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));

      const result = await getBlueskyOEmbed({ postUrl: POST_URL });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        'Unable to load Bluesky post preview'
      );
    });
  });

  describe('when the oembed payload is incomplete', () => {
    it.each(['html', 'author_name', 'author_url'])(
      'returns BAD_GATEWAY with the generic preview message when %s is missing',
      async (field) => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        fetchMock.mockResolvedValue(
          jsonResponse({ ...oembed, [field]: undefined })
        );

        const result = await getBlueskyOEmbed({ postUrl: POST_URL });

        expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
          'Unable to load Bluesky post preview'
        );
        expect(console.error).toHaveBeenCalledWith(
          '[provider-response]',
          JSON.stringify({
            provider: 'bluesky',
            call: 'GET /oembed',
            issues: [
              {
                path: field,
                code: 'invalid_type',
                expected: 'string',
                received: 'undefined'
              }
            ]
          })
        );
      }
    );
  });
});
