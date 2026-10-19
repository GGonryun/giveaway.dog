import {
  blueskyActorDid,
  blueskyActorFixture,
  blueskyLabelFixture
} from './fixtures-bluesky-actors';

export const blueskyRepostedByFixture = {
  repostedBy: [
    blueskyActorFixture(3, { labels: [blueskyLabelFixture(3)] }),
    blueskyActorFixture(4, {
      displayName: undefined,
      associated: {
        chat: { allowIncoming: 'none', allowGroupInvites: 'none' },
        activitySubscription: { allowSubscriptions: 'followers' },
        germ: {
          showButtonTo: 'everyone',
          messageMeUrl: 'https://germ.example/actor-4'
        }
      },
      status: {
        uri: `at://${blueskyActorDid(4)}/app.bsky.actor.status/self`,
        cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
        record: {
          $type: 'app.bsky.actor.status',
          createdAt: '2026-01-05T15:00:00.000Z',
          durationMinutes: 120,
          status: 'app.bsky.actor.status#live',
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              $type: 'app.bsky.embed.external#external',
              uri: 'https://stream.example/actor-4',
              title: 'Live now',
              description: 'Streaming the giveaway draw'
            }
          }
        },
        status: 'app.bsky.actor.status#live',
        embed: {
          $type: 'app.bsky.embed.external#view',
          external: {
            uri: 'https://stream.example/actor-4',
            title: 'Live now',
            description: 'Streaming the giveaway draw',
            thumb: `https://cdn.bsky.app/img/feed_thumbnail/plain/${blueskyActorDid(4)}/bafkreithumb4@jpeg`
          }
        },
        labels: [],
        expiresAt: '2026-01-05T17:00:00.000Z',
        isActive: true
      },
      verification: {
        verifications: [
          {
            issuer: 'did:plc:verifier0000000000000000',
            issuerDisplayName: 'Example Verifier',
            issuerHandle: 'verifier.example.com',
            uri: 'at://did:plc:verifier0000000000000000/app.bsky.graph.verification/3lverification4',
            isValid: true,
            createdAt: '2025-06-01T12:00:00.000Z'
          }
        ],
        verifiedStatus: 'valid',
        trustedVerifierStatus: 'none'
      },
      pronouns: 'they/them'
    })
  ],
  cursor: '3lrepostcursor',
  uri: 'at://did:plc:acmegiveaways000000000000/app.bsky.feed.post/3lacmepost222'
};
