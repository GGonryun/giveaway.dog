import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Agent } from '@atproto/api';
import { createSkeet } from '../create-skeet';
import { getLatestTeamBlueskyCredentials } from '@/lib/bluesky/get-latest-team-bluesky-agent';
import { ApplicationError } from '@giveaway/util-errors';
import { asPrismaClient } from '@giveaway/testing-server/prisma';

vi.mock('@/lib/bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: vi.fn()
}));

const credentialsMock = vi.mocked(getLatestTeamBlueskyCredentials);
const fetchMock = vi.fn<typeof fetch>();

const tx = asPrismaClient();
const NOW = new Date('2026-03-04T05:06:07.000Z');
const IMAGE_URL = 'https://cdn.giveaway.test/prize.png';

const createAgent = () => {
  const post = vi.fn();
  const uploadBlob = vi.fn();
  const resolveHandle = vi.fn();
  const agent = {
    post,
    uploadBlob,
    com: { atproto: { identity: { resolveHandle } } }
  } as unknown as Agent;
  return { agent, post, uploadBlob, resolveHandle };
};

describe('createSkeet', () => {
  let mocks: ReturnType<typeof createAgent>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    mocks = createAgent();
    mocks.post.mockResolvedValue({
      uri: 'at://did:plc:team/app.bsky.feed.post/3kskeet',
      cid: 'bafy-cid',
      validationStatus: 'valid'
    });
    credentialsMock.mockReset();
    credentialsMock.mockResolvedValue({
      agent: mocks.agent,
      did: 'did:plc:team',
      handle: 'team.bsky.social'
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('when the team id is missing', () => {
    it('throws INTERNAL_SERVER_ERROR without loading credentials', async () => {
      const error = await createSkeet(tx, { teamId: '', text: 'hi' }).catch(
        (e: unknown) => e
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing required parameter teamId'
      });
      expect(credentialsMock).not.toHaveBeenCalled();
    });
  });

  describe('when posting text only', () => {
    it('loads the team bluesky credentials with the transaction', async () => {
      await createSkeet(tx, { teamId: 'team-1', text: 'hello' });

      expect(credentialsMock).toHaveBeenCalledWith(tx, 'team-1');
    });

    it('posts the text with no facets and the current timestamp', async () => {
      await createSkeet(tx, { teamId: 'team-1', text: 'Giveaway is live' });

      expect(mocks.post).toHaveBeenCalledWith({
        text: 'Giveaway is live',
        facets: undefined,
        createdAt: '2026-03-04T05:06:07.000Z'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mocks.uploadBlob).not.toHaveBeenCalled();
    });

    it('returns only the uri and cid of the created post', async () => {
      const result = await createSkeet(tx, { teamId: 'team-1', text: 'hi' });

      expect(result).toEqual({
        uri: 'at://did:plc:team/app.bsky.feed.post/3kskeet',
        cid: 'bafy-cid'
      });
    });

    it('adds a link facet for urls in the text', async () => {
      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'Enter at https://giveaway.dog/g/1'
      });

      expect(mocks.post.mock.calls[0][0].facets).toEqual([
        {
          index: { byteStart: 9, byteEnd: 33 },
          features: [
            {
              $type: 'app.bsky.richtext.facet#link',
              uri: 'https://giveaway.dog/g/1'
            }
          ]
        }
      ]);
    });

    it('resolves mentions to dids through the team agent', async () => {
      mocks.resolveHandle.mockResolvedValue({
        data: { did: 'did:plc:alice' }
      });

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'Congrats @alice.bsky.social'
      });

      expect(mocks.resolveHandle).toHaveBeenCalledWith({
        handle: 'alice.bsky.social'
      });
      expect(mocks.post.mock.calls[0][0].facets).toEqual([
        {
          $type: 'app.bsky.richtext.facet',
          index: { byteStart: 9, byteEnd: 27 },
          features: [
            {
              $type: 'app.bsky.richtext.facet#mention',
              did: 'did:plc:alice'
            }
          ]
        }
      ]);
    });

    it('propagates a credentials error without posting', async () => {
      const failure = new ApplicationError({
        code: 'FORBIDDEN',
        message: 'Team does not have a connected Bluesky integration'
      });
      credentialsMock.mockRejectedValue(failure);

      await expect(
        createSkeet(tx, { teamId: 'team-1', text: 'hi' })
      ).rejects.toBe(failure);
      expect(mocks.post).not.toHaveBeenCalled();
    });

    it('propagates a post failure', async () => {
      const failure = new Error('xrpc post failed');
      mocks.post.mockRejectedValue(failure);

      await expect(
        createSkeet(tx, { teamId: 'team-1', text: 'hi' })
      ).rejects.toBe(failure);
    });
  });

  describe('when posting with an image', () => {
    const blob = { $type: 'blob', ref: 'bafy-image', mimeType: 'image/png' };

    beforeEach(() => {
      mocks.uploadBlob.mockResolvedValue({ data: { blob } });
    });

    it('downloads the image url', async () => {
      fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'hi',
        imageUrl: IMAGE_URL
      });

      expect(fetchMock).toHaveBeenCalledWith(IMAGE_URL);
    });

    it('uploads the image bytes as a Uint8Array', async () => {
      fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'hi',
        imageUrl: IMAGE_URL
      });

      const [bytes] = mocks.uploadBlob.mock.calls[0];
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(Array.from(bytes as Uint8Array)).toEqual([1, 2, 3]);
    });

    it('uploads the image once with no upload options', async () => {
      fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'hi',
        imageUrl: IMAGE_URL
      });

      expect(mocks.uploadBlob).toHaveBeenCalledTimes(1);
      expect(mocks.uploadBlob.mock.calls[0]).toHaveLength(1);
    });

    it('embeds the uploaded blob with empty alt text', async () => {
      fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'hi',
        imageUrl: IMAGE_URL
      });

      expect(mocks.post).toHaveBeenCalledWith({
        text: 'hi',
        facets: undefined,
        createdAt: '2026-03-04T05:06:07.000Z',
        embed: {
          $type: 'app.bsky.embed.images',
          images: [{ image: blob, alt: '' }]
        }
      });
    });

    it('uploads the body of a failed image download as the image', async () => {
      fetchMock.mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
      );

      await createSkeet(tx, {
        teamId: 'team-1',
        text: 'hi',
        imageUrl: IMAGE_URL
      });

      const [bytes] = mocks.uploadBlob.mock.calls[0];
      expect(new TextDecoder().decode(bytes as Uint8Array)).toBe('Not Found');
      expect(mocks.post).toHaveBeenCalledTimes(1);
    });

    it('treats an empty image url as no image', async () => {
      await createSkeet(tx, { teamId: 'team-1', text: 'hi', imageUrl: '' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mocks.post.mock.calls[0][0]).not.toHaveProperty('embed');
    });

    it('propagates an image download failure without posting', async () => {
      const failure = new TypeError('fetch failed');
      fetchMock.mockRejectedValue(failure);

      await expect(
        createSkeet(tx, { teamId: 'team-1', text: 'hi', imageUrl: IMAGE_URL })
      ).rejects.toBe(failure);
      expect(mocks.uploadBlob).not.toHaveBeenCalled();
      expect(mocks.post).not.toHaveBeenCalled();
    });

    it('propagates an upload failure without posting', async () => {
      fetchMock.mockResolvedValue(new Response(new Uint8Array([1])));
      const failure = new Error('blob too large');
      mocks.uploadBlob.mockRejectedValue(failure);

      await expect(
        createSkeet(tx, { teamId: 'team-1', text: 'hi', imageUrl: IMAGE_URL })
      ).rejects.toBe(failure);
      expect(mocks.post).not.toHaveBeenCalled();
    });
  });
});
