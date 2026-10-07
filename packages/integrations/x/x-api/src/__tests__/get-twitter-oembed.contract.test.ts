import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { findProviderResponseIssues } from '@giveaway/integration-server/provider-response';
import { expectOk } from '@giveaway/testing-server/result';
import { jsonResponse } from '@giveaway/testing-server/fixtures-integrations-utils';
import oembedResponse from '../testing/fixtures-x-oembed.json';
import { xOEmbedResponseSchema } from '../schemas';
import getTwitterOEmbed from '../get-twitter-oembed';

const fetchMock = vi.fn<typeof fetch>();

const POST_URL = 'https://x.com/TheGiveawayDog/status/1975236458112819456';

describe('X GET /oembed contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(oembedResponse.body));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that getTwitterOEmbed uses', () => {
    expect(
      findProviderResponseIssues(xOEmbedResponseSchema, oembedResponse.body)
    ).toEqual([]);
  });

  it('returns the embed of the recorded response', async () => {
    const result = await getTwitterOEmbed({ postUrl: POST_URL, theme: 'dark' });

    expect(expectOk(result)).toEqual({
      html: oembedResponse.body.html,
      authorName: 'Giveaway Dog',
      authorUrl: 'https://twitter.com/TheGiveawayDog',
      url: 'https://twitter.com/TheGiveawayDog/status/1975236458112819456'
    });
  });
});
