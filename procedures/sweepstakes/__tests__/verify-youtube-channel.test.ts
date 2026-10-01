import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';
import verifyYouTubeChannelDefault, {
  verifyYouTubeChannel
} from '../verify-youtube-channel';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

type Input = Parameters<typeof verifyYouTubeChannel>[0];

const API_KEY = 'yt-key';
const INVALID_URL_MESSAGE =
  'Invalid YouTube URL format. Please use youtube.com/@username, youtube.com/username, or youtube.com/channel/CHANNEL_ID';

const snippet = {
  title: 'Giveaway Dog',
  description: 'Woof',
  customUrl: '@giveawaydog',
  publishedAt: '2020-01-01T00:00:00Z',
  thumbnails: { default: { url: 'https://img.example.com/a.png' } }
};

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

const fetchMock = vi.fn<typeof fetch>();

const requestedUrl = () => new URL(String(fetchMock.mock.calls[0][0]));

const verify = (channelUrl: string) => verifyYouTubeChannel({ channelUrl });

describe('verifyYouTubeChannel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('YOUTUBE_API_KEY', API_KEY);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ items: [{ snippet }] }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports the same procedure as the default export', () => {
    expect(verifyYouTubeChannelDefault).toBe(verifyYouTubeChannel);
  });

  describe('access control and input', () => {
    it('returns UNAUTHORIZED when signed out', async () => {
      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an empty channel url', async () => {
      signIn();

      const result = await verify('');

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('rejects a missing channel url', async () => {
      signIn();

      const result = await verifyYouTubeChannel({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('url parsing', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects a value that is not a url', async () => {
      const result = await verify('giveawaydog');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        INVALID_URL_MESSAGE
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects urls from other hosts', async () => {
      const result = await verify('https://vimeo.com/@giveawaydog');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        INVALID_URL_MESSAGE
      );
    });

    it('rejects the youtube home page', async () => {
      const result = await verify('https://www.youtube.com/');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        INVALID_URL_MESSAGE
      );
    });

    it('rejects legacy custom url paths with a nested segment', async () => {
      const result = await verify('https://www.youtube.com/c/giveawaydog');

      expectFailure(result, 'BAD_REQUEST');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a single segment containing unsupported characters', async () => {
      const result = await verify('https://www.youtube.com/giveaway.dog');

      expectFailure(result, 'BAD_REQUEST');
    });

    it('looks up an @handle url by handle', async () => {
      await verify('https://www.youtube.com/@giveawaydog');

      expect(requestedUrl().searchParams.get('forHandle')).toBe('@giveawaydog');
      expect(requestedUrl().searchParams.has('id')).toBe(false);
    });

    it('ignores trailing path segments after an @handle', async () => {
      await verify('https://www.youtube.com/@giveawaydog/videos');

      expect(requestedUrl().searchParams.get('forHandle')).toBe('@giveawaydog');
    });

    it('looks up a channel url by channel id', async () => {
      await verify('https://youtube.com/channel/UC123abc/featured');

      expect(requestedUrl().searchParams.get('id')).toBe('UC123abc');
      expect(requestedUrl().searchParams.has('forHandle')).toBe(false);
    });

    it('treats a bare username path as a handle', async () => {
      await verify('https://m.youtube.com/giveaway_dog-1');

      expect(requestedUrl().searchParams.get('forHandle')).toBe(
        '@giveaway_dog-1'
      );
    });

    it('treats a video watch url as a handle named watch', async () => {
      await verify('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(requestedUrl().searchParams.get('forHandle')).toBe('@watch');
    });

    it('accepts any host that contains youtube.com', async () => {
      await verify('https://youtube.com.example.org/@giveawaydog');

      expect(requestedUrl().searchParams.get('forHandle')).toBe('@giveawaydog');
    });
  });

  describe('api configuration', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns FORBIDDEN when the api key is not configured', async () => {
      vi.stubEnv('YOUTUBE_API_KEY', '');

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'YouTube API key not configured'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('validates the url before checking the api key', async () => {
      vi.stubEnv('YOUTUBE_API_KEY', '');

      const result = await verify('https://vimeo.com/@giveawaydog');

      expectFailure(result, 'BAD_REQUEST');
    });

    it('calls the channels endpoint with the snippet part and api key', async () => {
      await verify('https://www.youtube.com/@giveawaydog');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&key=yt-key&forHandle=%40giveawaydog',
        { headers: { Accept: 'application/json' } }
      );
    });
  });

  describe('api responses', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns the channel snippet', async () => {
      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectOk(result)).toEqual(snippet);
    });

    it('strips unknown snippet fields', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          items: [{ snippet: { ...snippet, country: 'US' } }]
        })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectOk(result)).not.toHaveProperty('country');
    });

    it('uses the first channel when several are returned', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          items: [{ snippet }, { snippet: { ...snippet, title: 'Second' } }]
        })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectOk(result).title).toBe('Giveaway Dog');
    });

    it('accepts a snippet without a custom url', async () => {
      const withoutCustomUrl = {
        title: snippet.title,
        description: snippet.description,
        publishedAt: snippet.publishedAt,
        thumbnails: snippet.thumbnails
      };
      fetchMock.mockResolvedValue(
        jsonResponse({ items: [{ snippet: withoutCustomUrl }] })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectOk(result)).toEqual(withoutCustomUrl);
    });

    it('returns BAD_REQUEST when the api responds with an error status', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: { message: 'quota' } }, { status: 403 })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Failed to verify YouTube channel. Please check if the channel exists or try again later.'
      );
    });

    it('logs the api error details', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { error: { message: 'quota' } },
          { status: 403, statusText: 'Forbidden' }
        )
      );

      await verify('https://www.youtube.com/@giveawaydog');

      expect(console.error).toHaveBeenCalledWith('YouTube API error:', {
        status: 403,
        statusText: 'Forbidden',
        error: { error: { message: 'quota' } }
      });
    });

    it('returns BAD_REQUEST when an error response body is not json', async () => {
      fetchMock.mockResolvedValue(
        new Response('<html>oops</html>', { status: 500 })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expectFailure(result, 'BAD_REQUEST');
      expect(console.error).toHaveBeenCalledWith(
        'YouTube API error:',
        expect.objectContaining({ status: 500, error: {} })
      );
    });

    it('returns a silent BAD_REQUEST when no channel matches', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ items: [] }));

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'YouTube channel not found. Please check if the channel exists or double check the URL.'
      );
      expect(console.error).not.toHaveBeenCalledWith(
        'Application error:',
        expect.anything()
      );
    });

    it('returns BAD_REQUEST when the response has no items field', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ kind: 'youtube#list' }));

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'YouTube channel not found. Please check if the channel exists or double check the URL.'
      );
    });

    it('returns VALIDATION_ERROR with the zod cause for a malformed snippet', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ items: [{ snippet: { title: 'Only title' } }] })
      );

      const result = await verify('https://www.youtube.com/@giveawaydog');

      const failure = expectFailure(result, 'VALIDATION_ERROR');
      expect(failure.message).toBe(
        'Failed to validate YouTube channel snippet data'
      );
      expect(failure.cause).toBeInstanceOf(ZodError);
    });

    it('returns VALIDATION_ERROR when the item has no snippet', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ items: [{ id: 'UC1' }] }));

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expectFailure(result, 'VALIDATION_ERROR');
    });

    it('returns INTERNAL_SERVER_ERROR when the request fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when a successful response is not json', async () => {
      fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));

      const result = await verify('https://www.youtube.com/@giveawaydog');

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.'
      );
    });
  });
});
