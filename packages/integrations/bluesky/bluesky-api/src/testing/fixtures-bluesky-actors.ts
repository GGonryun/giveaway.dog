export const blueskyActorDid = (index: number) =>
  `did:plc:blueskyactor${String(index).padStart(14, '0')}`;

export const blueskyLabelFixture = (index: number) => ({
  src: blueskyActorDid(index),
  uri: `at://${blueskyActorDid(index)}/app.bsky.actor.profile/self`,
  cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
  val: 'giveaways',
  cts: '2025-03-01T12:00:00.000Z'
});

export const blueskyActorFixture = (
  index: number,
  overrides: Record<string, unknown> = {}
) => ({
  did: blueskyActorDid(index),
  handle: `actor-${index}.bsky.social`,
  displayName: `Actor ${index}`,
  avatar: `https://cdn.bsky.app/img/avatar/plain/${blueskyActorDid(index)}/bafkreiavatar${index}@jpeg`,
  associated: {
    chat: { allowIncoming: 'following' },
    activitySubscription: { allowSubscriptions: 'followers' }
  },
  labels: [],
  createdAt: '2024-05-01T12:00:00.000Z',
  description: `Bio of actor ${index}`,
  indexedAt: '2026-01-03T12:00:00.000Z',
  ...overrides
});
