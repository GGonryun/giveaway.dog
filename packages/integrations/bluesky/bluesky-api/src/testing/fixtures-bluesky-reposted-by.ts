import { blueskyActorFixture } from './fixtures-bluesky-actors';

export const blueskyRepostedByFixture = {
  uri: 'at://did:plc:acmegiveaways000000000000/app.bsky.feed.post/3lacmepost222',
  cursor: '3lrepostcursor',
  repostedBy: [
    blueskyActorFixture(3),
    blueskyActorFixture(4, { displayName: undefined })
  ]
};
