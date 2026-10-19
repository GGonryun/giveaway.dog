import { blueskyActorFixture } from './fixtures-bluesky-actors';

export const blueskyLikesFixture = {
  uri: 'at://did:plc:acmegiveaways000000000000/app.bsky.feed.post/3lacmepost222',
  cursor: '1767225600000::bafyreilikescursor',
  likes: [
    {
      indexedAt: '2026-01-05T16:00:00.000Z',
      createdAt: '2026-01-05T16:00:00.000Z',
      actor: blueskyActorFixture(1)
    },
    {
      indexedAt: '2026-01-05T16:05:00.000Z',
      createdAt: '2026-01-05T16:05:00.000Z',
      actor: blueskyActorFixture(2, { displayName: '', avatar: undefined })
    }
  ]
};
