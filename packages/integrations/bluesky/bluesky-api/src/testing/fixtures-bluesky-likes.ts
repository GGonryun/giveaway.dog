import {
  blueskyActorFixture,
  blueskyLabelFixture
} from './fixtures-bluesky-actors';

export const blueskyLikesFixture = {
  likes: [
    {
      actor: blueskyActorFixture(1, {
        displayName: undefined,
        avatar: undefined,
        description: undefined,
        indexedAt: undefined
      }),
      createdAt: '2026-01-05T16:00:00.000Z',
      indexedAt: '2026-01-05T16:00:00.000Z'
    },
    {
      actor: blueskyActorFixture(2, {
        associated: {
          chat: { allowIncoming: 'all', allowGroupInvites: 'following' },
          activitySubscription: { allowSubscriptions: 'mutuals' }
        },
        labels: [blueskyLabelFixture(2)]
      }),
      createdAt: '2026-01-05T16:05:00.000Z',
      indexedAt: '2026-01-05T16:05:00.000Z'
    }
  ],
  cursor: '1767225600000::bafyreilikescursor',
  uri: 'at://did:plc:acmegiveaways000000000000/app.bsky.feed.post/3lacmepost222'
};
