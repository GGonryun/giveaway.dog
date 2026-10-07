import { describe, it, expect } from 'vitest';
import {
  MAX_PEOPLE,
  anonymousBlueskyActor,
  anonymousDid,
  anonymousXUser,
  firstItems,
  redactSecrets,
  replaceFields,
  replaceText
} from '../sanitize.ts';

describe('redactSecrets', () => {
  it('replaces the strings of token, secret, password, email and jwt keys at any depth', () => {
    expect(
      redactSecrets({
        access_token: 'a',
        nested: { refreshJwt: 'b', items: [{ email: 'c' }] },
        client_secret: 'd',
        password: 'e',
        emails: 'f'
      })
    ).toEqual({
      access_token: 'redacted-access-token',
      nested: {
        refreshJwt: 'redacted-refreshJwt',
        items: [{ email: 'redacted-email' }]
      },
      client_secret: 'redacted-client-secret',
      password: 'redacted-password',
      emails: 'redacted-emails'
    });
  });

  it('keeps the other keys and the values that are not strings', () => {
    const body = {
      token_type: 'bearer',
      expires_in: 3600,
      access_token: null,
      id_token: 7,
      text: 'hello'
    };

    expect(redactSecrets(body)).toEqual(body);
  });

  it('returns values that are not objects as they are', () => {
    expect(redactSecrets('secret')).toBe('secret');
    expect(redactSecrets(null)).toBeNull();
  });
});

describe('replaceText', () => {
  it('replaces a string that is not empty', () => {
    expect(replaceText('real', 'fake')).toBe('fake');
  });

  it.each([null, undefined, '', 3])('keeps %j', (value) => {
    expect(replaceText(value, 'fake')).toBe(value);
  });
});

describe('replaceFields', () => {
  it('replaces only the fields the value has', () => {
    expect(
      replaceFields({ name: 'Real', url: null }, { name: 'Fake', bio: 'Fake' })
    ).toEqual({ name: 'Fake', url: null });
  });

  it('returns a value that is not an object as it is', () => {
    expect(replaceFields(['a'], { 0: 'b' })).toEqual(['a']);
  });
});

describe('firstItems', () => {
  it('keeps the first three items by default', () => {
    expect(firstItems([1, 2, 3, 4])).toEqual([1, 2, 3]);
  });

  it('never keeps more items than there are synthetic people', () => {
    expect(
      firstItems(
        Array.from({ length: 20 }, (_, i) => i),
        20
      )
    ).toHaveLength(MAX_PEOPLE);
  });

  it('returns an empty list for a value that is not a list', () => {
    expect(firstItems(null)).toEqual([]);
  });
});

describe('anonymousXUser', () => {
  it('replaces the identity of the user and keeps the rest', () => {
    expect(
      anonymousXUser(
        {
          id: '44196397',
          username: 'real_person',
          name: 'Real Person',
          description: 'Real bio',
          location: '',
          url: null,
          profile_image_url: 'https://pbs.twimg.com/real.jpg',
          profile_banner_url: 'https://pbs.twimg.com/banner.jpg',
          followers_count: 10,
          verified: false
        },
        1
      )
    ).toEqual({
      id: '1000000000000000002',
      username: 'retweeter_2',
      name: 'Retweeter 2',
      description: 'Bio of retweeter 2',
      location: '',
      url: null,
      profile_image_url: 'https://example.com/retweeter_2/profile.jpg',
      profile_banner_url: 'https://example.com/retweeter_2/banner.jpg',
      followers_count: 10,
      verified: false
    });
  });
});

describe('anonymousDid', () => {
  it.each(Array.from({ length: MAX_PEOPLE }, (_, index) => index))(
    'makes a valid plc did for person %i',
    (index) => {
      expect(anonymousDid('reposter', index)).toMatch(/^did:plc:[a-z2-7]{24}$/);
    }
  );

  it('names the role and the person', () => {
    expect(anonymousDid('liker', 0)).toBe('did:plc:likerone2222222222222222');
  });
});

describe('anonymousBlueskyActor', () => {
  it('replaces the identity, the viewer state and the labels of the actor', () => {
    expect(
      anonymousBlueskyActor(
        {
          did: 'did:plc:realperson',
          handle: 'real.bsky.social',
          displayName: 'Real Person',
          avatar: 'https://cdn.bsky.app/real.jpg',
          viewer: {
            muted: false,
            followedBy: 'at://did:plc:realperson/app.bsky.graph.follow/1'
          },
          labels: [{ src: 'did:plc:realperson', val: 'x' }],
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        'liker',
        1
      )
    ).toEqual({
      did: 'did:plc:likertwo2222222222222222',
      handle: 'liker-two.bsky.social',
      displayName: 'Liker Two',
      avatar: 'https://example.com/liker-two/avatar.jpg',
      viewer: { muted: false, blockedBy: false },
      labels: [],
      createdAt: '2024-01-01T00:00:00.000Z'
    });
  });

  it('does not add a viewer or labels that the actor did not have', () => {
    expect(
      anonymousBlueskyActor(
        { did: 'did:plc:realperson', handle: 'real.bsky.social' },
        'reposter',
        0
      )
    ).toEqual({
      did: 'did:plc:reposterone2222222222222',
      handle: 'reposter-one.bsky.social'
    });
  });

  it('returns a value that is not an object as it is', () => {
    expect(anonymousBlueskyActor(null, 'liker', 0)).toBeNull();
  });
});
