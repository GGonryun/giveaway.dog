import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asPrismaClient } from '@giveaway/testing-server/prisma';
import { blueskyCreateRecordSchema } from '../schemas';
import {
  BLUESKY_VIEWER_DID,
  blueskyAgent,
  blueskyCreateRecordResponse
} from '../testing/fixtures-bluesky';
import { createSkeet } from '../create-skeet';

const m = vi.hoisted(() => ({ getLatestTeamBlueskyCredentials: vi.fn() }));

vi.mock('../bluesky/get-latest-team-bluesky-agent', () => ({
  getLatestTeamBlueskyCredentials: m.getLatestTeamBlueskyCredentials
}));

const NOW = new Date('2026-10-06T16:00:00.000Z');

const recordedAgent = () => {
  const recorded = blueskyAgent({
    'com.atproto.repo.createRecord': blueskyCreateRecordResponse
  });
  m.getLatestTeamBlueskyCredentials.mockResolvedValue({
    agent: recorded.agent
  });
  return recorded;
};

describe('Bluesky com.atproto.repo.createRecord contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses the recorded response with the schema that createSkeet uses', () => {
    expect(() =>
      blueskyCreateRecordSchema.parse(blueskyCreateRecordResponse)
    ).not.toThrow();
  });

  it('creates a post record in the repository of the team account', async () => {
    const { fetchMock } = recordedAgent();

    await createSkeet(asPrismaClient(), {
      teamId: 'team-1',
      text: 'Giveaway time!'
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe('/xrpc/com.atproto.repo.createRecord');
    expect(init.method).toBe('post');
    expect(
      JSON.parse(new TextDecoder().decode(init.body as Uint8Array))
    ).toEqual({
      repo: BLUESKY_VIEWER_DID,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Giveaway time!',
        createdAt: NOW.toISOString()
      }
    });
  });

  it('returns the uri and cid of the recorded post', async () => {
    recordedAgent();

    await expect(
      createSkeet(asPrismaClient(), {
        teamId: 'team-1',
        text: 'Giveaway time!'
      })
    ).resolves.toEqual({
      uri: 'at://did:plc:gvdogxk4ui5q2nf3rmbz7ytc/app.bsky.feed.post/3m2jy7reeuj2b',
      cid: 'bafyreihx67gkhrusycvbjhwcxmk6w43hu4u7osm7zzbf5pg6oepwq63fty'
    });
  });
});
