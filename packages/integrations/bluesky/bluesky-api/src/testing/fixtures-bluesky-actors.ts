export const blueskyActorFixture = (
  index: number,
  overrides: Record<string, unknown> = {}
) => ({
  did: `did:plc:blueskyactor${String(index).padStart(14, '0')}`,
  handle: `actor-${index}.bsky.social`,
  displayName: `Actor ${index}`,
  avatar: `https://cdn.bsky.app/img/avatar/plain/did:plc:blueskyactor${String(index).padStart(14, '0')}/bafkreiavatar${index}@jpeg`,
  associated: { chat: { allowIncoming: 'following' } },
  viewer: { muted: false, blockedBy: false },
  labels: [],
  createdAt: '2024-05-01T12:00:00.000Z',
  description: `Bio of actor ${index}`,
  indexedAt: '2026-01-03T12:00:00.000Z',
  ...overrides
});
