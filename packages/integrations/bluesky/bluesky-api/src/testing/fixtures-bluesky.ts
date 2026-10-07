import { vi } from 'vitest';
import { Agent } from '@atproto/api';
import createRecordResponse from './fixtures-bluesky-create-record.json';
import likesResponse from './fixtures-bluesky-likes.json';
import oembedResponse from './fixtures-bluesky-oembed.json';
import postThreadResponse from './fixtures-bluesky-post-thread.json';
import profileResponse from './fixtures-bluesky-profile.json';
import repostedByResponse from './fixtures-bluesky-reposted-by.json';

export const BLUESKY_SERVICE = 'https://bsky.social';

export const BLUESKY_VIEWER_DID = 'did:plc:vxewer2y6kq3m5n7p4r2s3t5';

export const blueskyProfileResponse = profileResponse.body;

export const blueskyLikesResponse = likesResponse.body;

export const blueskyRepostedByResponse = repostedByResponse.body;

export const blueskyPostThreadResponse = postThreadResponse.body;

export const blueskyCreateRecordResponse = createRecordResponse.body;

export const blueskyOEmbedResponse = oembedResponse.body;

export const xrpcResponse = <T>(data: T) => ({
  success: true as const,
  headers: {},
  data
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export const blueskyAgent = (responses: Record<string, unknown>) => {
  const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>(
    async (url) => {
      const nsid = url.pathname.replace('/xrpc/', '');
      return nsid in responses
        ? jsonResponse(responses[nsid])
        : jsonResponse({ error: 'MethodNotImplemented' }, 501);
    }
  );

  const agent = new Agent({
    did: BLUESKY_VIEWER_DID,
    fetchHandler: (url, init) => fetchMock(new URL(url, BLUESKY_SERVICE), init)
  });

  return { agent, fetchMock };
};
