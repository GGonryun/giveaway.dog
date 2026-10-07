import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { expectOk } from '@giveaway/testing-server/result';
import { jsonResponse } from '@giveaway/testing-server/fixtures-integrations-utils';
import { blueskyOEmbedResponseSchema } from '../schemas';
import { blueskyOEmbedResponse } from '../testing/fixtures-bluesky';
import getBlueskyOEmbed from '../get-bluesky-oembed';

const fetchMock = vi.fn<typeof fetch>();

const POST_URL = 'https://bsky.app/profile/giveaway.dog/post/3m2jy7mls222b';

describe('Bluesky GET /oembed contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(blueskyOEmbedResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses the recorded response with the schema that getBlueskyOEmbed uses', () => {
    expect(() =>
      blueskyOEmbedResponseSchema.parse(blueskyOEmbedResponse)
    ).not.toThrow();
  });

  it('returns the embed of the recorded response', async () => {
    const result = await getBlueskyOEmbed({ postUrl: POST_URL });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://embed.bsky.app/oembed?url=${encodeURIComponent(POST_URL)}`
    );
    expect(expectOk(result)).toEqual({
      html: blueskyOEmbedResponse.html,
      authorName: 'Giveaway Dog (@giveaway.dog)',
      authorUrl: 'https://bsky.app/profile/giveaway.dog'
    });
  });
});
