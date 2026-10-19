import { describe, expect, it } from 'vitest';
import {
  blueskyActorSchema,
  blueskyLikesSchema,
  blueskyOEmbedSchema,
  blueskyProfileSchema,
  blueskyRepostedBySchema
} from '../schemas';

const actor = {
  did: 'did:plc:acme',
  handle: 'acme.bsky.social',
  displayName: 'Acme Dog',
  avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:acme/a@jpeg'
};

describe('blueskyProfileSchema', () => {
  it('keeps the did and the handle', () => {
    expect(blueskyProfileSchema.parse({ ...actor, followersCount: 3 })).toEqual(
      { did: actor.did, handle: actor.handle }
    );
  });

  it('refuses a profile without a did', () => {
    expect(
      blueskyProfileSchema.safeParse({ handle: actor.handle }).success
    ).toBe(false);
  });
});

describe('blueskyActorSchema', () => {
  it('keeps the fields that the app reads', () => {
    expect(blueskyActorSchema.parse({ ...actor, labels: [] })).toEqual(actor);
  });

  it('accepts an actor with no display name and no avatar', () => {
    const bare = { did: actor.did, handle: actor.handle };
    expect(blueskyActorSchema.parse(bare)).toEqual(bare);
  });
});

describe('blueskyLikesSchema', () => {
  it('keeps the actors and the cursor', () => {
    const page = { likes: [{ actor }], cursor: 'next' };
    expect(
      blueskyLikesSchema.parse({
        ...page,
        likes: [{ actor, createdAt: '2026-01-01T00:00:00.000Z' }]
      })
    ).toEqual(page);
  });

  it('refuses a like without an actor', () => {
    expect(blueskyLikesSchema.safeParse({ likes: [{}] }).success).toBe(false);
  });
});

describe('blueskyRepostedBySchema', () => {
  it('keeps the actors and the cursor', () => {
    const page = { repostedBy: [actor], cursor: 'next' };
    expect(blueskyRepostedBySchema.parse(page)).toEqual(page);
  });

  it('refuses a page without the list of actors', () => {
    expect(
      blueskyRepostedBySchema.safeParse({ reposts: [actor] }).success
    ).toBe(false);
  });
});

describe('blueskyOEmbedSchema', () => {
  it('keeps the fields that the app reads', () => {
    const embed = {
      html: '<blockquote class="bluesky-embed"></blockquote>',
      author_name: 'Acme Dog',
      author_url: 'https://bsky.app/profile/did:plc:acme'
    };
    expect(blueskyOEmbedSchema.parse({ ...embed, version: '1.0' })).toEqual(
      embed
    );
  });
});
