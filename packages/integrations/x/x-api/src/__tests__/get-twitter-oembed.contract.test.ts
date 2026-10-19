import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeNetwork } from '@giveaway/testing-server/faults';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import getTwitterOEmbed from '../get-twitter-oembed';
import { twitterOEmbedResponseSchema } from '../schemas';
import { xOEmbedFixture } from '../testing/fixtures-x-oembed';

const POST_URL = 'https://x.com/acme_giveaways/status/1900000000000000001';

describe('X oEmbed contract', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded embed with the schema of the app', () => {
    expect(twitterOEmbedResponseSchema.safeParse(xOEmbedFixture)).toEqual(
      expect.objectContaining({ success: true })
    );
  });

  it('turns the recorded embed into the preview of the app', async () => {
    const network = fakeNetwork();
    network.json('https://publish.twitter.com/oembed', xOEmbedFixture);

    const result = await getTwitterOEmbed({ postUrl: POST_URL, theme: 'dark' });

    expect(expectOk(result)).toEqual({
      html: xOEmbedFixture.html,
      authorName: 'Acme Giveaways',
      authorUrl: 'https://twitter.com/acme_giveaways',
      url: 'https://twitter.com/acme_giveaways/status/1900000000000000001'
    });
  });

  it('refuses an embed whose html changed type', async () => {
    const network = fakeNetwork();
    network.json('https://publish.twitter.com/oembed', {
      ...xOEmbedFixture,
      html: null
    });

    const result = await getTwitterOEmbed({ postUrl: POST_URL, theme: 'dark' });

    expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
      'Unable to load tweet preview'
    );
  });
});
