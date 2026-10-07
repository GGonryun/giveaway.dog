import { describe, it, expect } from 'vitest';
import {
  MAX_PEOPLE,
  VIEWER_DID,
  allow,
  anonymousBlueskyActor,
  anonymousDid,
  anonymousXUser,
  count,
  date,
  empty,
  fields,
  id,
  items,
  keep,
  keepAll,
  plain,
  redactSecrets,
  syntheticDate,
  text,
  viewerState
} from '../sanitize.ts';

const NOT_ANONYMIZED = 'The recorder cannot anonymize the value of';

describe('redactSecrets', () => {
  it('replaces the strings of secret keys at any depth', () => {
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

  it.each([
    'phone',
    'cookie',
    'set_cookies',
    'authorization',
    'api_key',
    'apiKey',
    'session',
    'session_id',
    'sessionId'
  ])('replaces the string of the key %s', (key) => {
    expect(redactSecrets({ [key]: 'real' })).toEqual({
      [key]: `redacted-${key.replaceAll('_', '-')}`
    });
  });

  it('replaces each string of a list under a secret key', () => {
    expect(
      redactSecrets({ emails: ['a@example.com', 'b@example.com'], ids: ['1'] })
    ).toEqual({
      emails: ['redacted-emails', 'redacted-emails'],
      ids: ['1']
    });
  });

  it('keeps the other keys and the values that are not strings', () => {
    const body = {
      token_type: 'bearer',
      expires_in: 3600,
      access_token: null,
      id_token: 7,
      sessions_count: 2,
      text: 'hello'
    };

    expect(redactSecrets(body)).toEqual(body);
  });

  it('returns values that are not objects as they are', () => {
    expect(redactSecrets('secret')).toBe('secret');
    expect(redactSecrets(null)).toBeNull();
  });
});

describe('keep', () => {
  it('returns the value as it is', () => {
    const value = { nested: ['a'] };
    expect(keep(value, 'key')).toBe(value);
  });
});

describe('keepAll', () => {
  it('keeps each named field', () => {
    expect(
      allow({ a: 1, b: { c: 2 }, d: 3 }, keepAll(['a', 'b']), 'body')
    ).toEqual({ a: 1, b: { c: 2 } });
  });
});

describe('plain', () => {
  it.each(['Business', 3, false, null, undefined])('keeps %j', (value) => {
    expect(plain(value, 'key')).toBe(value);
  });

  it.each([[{ type: 'x' }], [['x']]])(
    'refuses %j without naming its value',
    (value) => {
      expect(() => plain(value, 'verified_type')).toThrow(
        `${NOT_ANONYMIZED} verified_type`
      );
    }
  );
});

describe('empty', () => {
  it('replaces a list with an empty list', () => {
    expect(empty([{ src: 'did:plc:real' }], 'labels')).toEqual([]);
  });

  it.each([null, undefined])('keeps %j', (value) => {
    expect(empty(value, 'labels')).toBe(value);
  });

  it.each([[{ src: 'did:plc:real' }], ['did:plc:real']])(
    'refuses %j',
    (value) => {
      expect(() => empty(value, 'labels')).toThrow(`${NOT_ANONYMIZED} labels`);
    }
  );
});

describe('text', () => {
  it('replaces a string that is not empty', () => {
    expect(text('fake')('real', 'name')).toBe('fake');
  });

  it.each([null, undefined, '', false])('keeps %j', (value) => {
    expect(text('fake')(value, 'name')).toBe(value);
  });

  it.each([[7], [{ first: 'Real' }], [['Real']]])(
    'refuses %j without naming its value',
    (value) => {
      let message = '';
      try {
        text('fake')(value, 'name');
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toBe(`${NOT_ANONYMIZED} name`);
    }
  );
});

describe('id', () => {
  it('replaces a string id with the synthetic id as a string', () => {
    expect(id(1000000000000000001n)('44196397', 'id')).toBe(
      '1000000000000000001'
    );
  });

  it('replaces a numeric id with the synthetic id as a number', () => {
    expect(id(100000001n)(44196397, 'id')).toBe(100000001);
  });

  it('keeps an id that is null', () => {
    expect(id(1n)(null, 'id')).toBeNull();
  });

  it('refuses an id that is an object', () => {
    expect(() => id(1n)({ id: '44196397' }, 'id')).toThrow(
      `${NOT_ANONYMIZED} id`
    );
  });
});

describe('count', () => {
  it('replaces a number', () => {
    expect(count(100)(523, 'followers_count')).toBe(100);
  });

  it('replaces a string of digits with a string of digits', () => {
    expect(count(100)('523', 'followers_count')).toBe('100');
  });

  it.each([null, undefined, '1.2K', ' 12', '12 '])('keeps %j', (value) => {
    expect(count(100)(value, 'followers_count')).toBe(value);
  });

  it('refuses a count that is an object', () => {
    expect(() => count(100)({ value: 523 }, 'followers_count')).toThrow(
      `${NOT_ANONYMIZED} followers_count`
    );
  });
});

describe('date', () => {
  const replacement = new Date('2020-01-01T12:00:00.000Z');

  it.each([
    ['2019-04-02T08:15:00.482Z', '2020-01-01T12:00:00.000Z'],
    ['2019-04-02T08:15:00Z', '2020-01-01T12:00:00Z'],
    ['2019-04-02T08:15:00.1+00:00', '2020-01-01T12:00:00.0+00:00'],
    ['2019-04-02T08:15:00.123456-05:00', '2020-01-01T12:00:00.000000-05:00'],
    ['Tue Apr 02 08:15:00 +0000 2019', 'Wed Jan 01 12:00:00 +0000 2020']
  ])('replaces %s and keeps its format', (value, expected) => {
    expect(date(replacement)(value, 'created_at')).toBe(expected);
  });

  it('writes the weekday, the month and the time of the legacy format', () => {
    expect(
      date(new Date('2018-11-25T09:05:07.000Z'))(
        'Tue Apr 02 08:15:00 +0000 2019',
        'created_at'
      )
    ).toBe('Sun Nov 25 09:05:07 +0000 2018');
  });

  it.each([null, undefined, ''])('keeps %j', (value) => {
    expect(date(replacement)(value, 'created_at')).toBe(value);
  });

  it.each([
    ['a date without a time', '2019-04-02'],
    ['a date with a space', '2019-04-02 08:15:00'],
    ['a date with text around it', 'on 2019-04-02T08:15:00Z'],
    ['a legacy date with text after it', 'Tue Apr 02 08:15:00 +0000 2019 UTC'],
    ['a timestamp', 1554192900]
  ])('refuses %s', (_, value) => {
    expect(() => date(replacement)(value, 'created_at')).toThrow(
      `${NOT_ANONYMIZED} created_at`
    );
  });
});

describe('allow', () => {
  it('keeps the listed fields in the order of the value and replaces them', () => {
    const value = { b: 'real', extra: 'drop', a: 1 };

    const result = allow(value, { a: keep, b: text('fake') }, 'body');

    expect(result).toEqual({ b: 'fake', a: 1 });
    expect(Object.keys(result as object)).toEqual(['b', 'a']);
  });

  it('drops the keys that only the prototype of the fields has', () => {
    expect(
      allow(
        { toString: 'real', constructor: 'real', a: 1 },
        { a: keep },
        'body'
      )
    ).toEqual({ a: 1 });
  });

  it('passes the name of each field to its replacement', () => {
    expect(() => allow({ name: 7 }, { name: text('fake') }, 'body')).toThrow(
      `${NOT_ANONYMIZED} name`
    );
  });

  it.each([null, undefined])('keeps %j', (value) => {
    expect(allow(value, { a: keep }, 'body')).toBe(value);
  });

  it.each([['real'], [['real']]])('refuses %j', (value) => {
    expect(() => allow(value, { a: keep }, 'thread')).toThrow(
      `${NOT_ANONYMIZED} thread`
    );
  });
});

describe('fields', () => {
  it('allows the fields of the value under its key', () => {
    expect(fields({ a: keep })({ a: 1, b: 2 }, 'body')).toEqual({ a: 1 });
    expect(() => fields({ a: keep })('real', 'record')).toThrow(
      `${NOT_ANONYMIZED} record`
    );
  });
});

describe('items', () => {
  const label = (item: unknown, index: number) => `${String(item)}-${index}`;

  it('keeps the first three items by default and passes their index', () => {
    expect(items(label)(['a', 'b', 'c', 'd'], 'data')).toEqual([
      'a-0',
      'b-1',
      'c-2'
    ]);
  });

  it('keeps the number of items it is given', () => {
    expect(items(label, 2)(['a', 'b', 'c'], 'data')).toEqual(['a-0', 'b-1']);
  });

  it('never keeps more items than there are synthetic people', () => {
    expect(
      items(label, 20)(
        Array.from({ length: 20 }, (_, index) => index),
        'data'
      )
    ).toHaveLength(MAX_PEOPLE);
  });

  it.each([null, undefined])('keeps %j', (value) => {
    expect(items(label)(value, 'data')).toBe(value);
  });

  it('refuses a value that is not a list', () => {
    expect(() => items(label)({ 0: 'a' }, 'data')).toThrow(
      `${NOT_ANONYMIZED} data`
    );
  });
});

describe('syntheticDate', () => {
  it('gives each person a day of January 2020 at noon', () => {
    expect(syntheticDate(0).toISOString()).toBe('2020-01-01T12:00:00.000Z');
    expect(syntheticDate(2).toISOString()).toBe('2020-01-03T12:00:00.000Z');
  });
});

describe('anonymousXUser', () => {
  it('replaces the identity, the counts and the dates of the user', () => {
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
          followers_count: 523,
          following_count: '311',
          tweet_count: null,
          verified: false,
          verified_type: 'Business',
          is_blue_verified: true,
          created_at: 'Tue Apr 02 08:15:00 +0000 2019',
          can_dm: false
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
      followers_count: 200,
      following_count: '20',
      tweet_count: null,
      verified: false,
      verified_type: 'Business',
      is_blue_verified: true,
      created_at: 'Thu Jan 02 12:00:00 +0000 2020',
      can_dm: false
    });
  });

  it('drops the fields that it does not know', () => {
    expect(
      anonymousXUser(
        {
          id: '44196397',
          pinned_tweet_ids: ['1'],
          entities: { url: 'https://real.example' },
          professional: { category: 'Real' }
        },
        0
      )
    ).toEqual({ id: '1000000000000000001' });
  });

  it('refuses a user field that it cannot anonymize', () => {
    expect(() =>
      anonymousXUser({ id: '1', location: { city: 'Real' } }, 0)
    ).toThrow(`${NOT_ANONYMIZED} location`);
  });

  it('refuses an entry that is not a user', () => {
    expect(() => anonymousXUser('real_person', 2)).toThrow(
      `${NOT_ANONYMIZED} retweeter_3`
    );
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
  it('replaces the identity, the viewer state, the labels and the dates of the actor', () => {
    expect(
      anonymousBlueskyActor(
        {
          did: 'did:plc:realperson',
          handle: 'real.bsky.social',
          displayName: 'Real Person',
          description: 'Real bio',
          avatar: 'https://cdn.bsky.app/real.jpg',
          banner: 'https://cdn.bsky.app/banner.jpg',
          associated: { chat: { allowIncoming: 'all' } },
          verification: { verifications: [{ issuer: 'did:plc:other' }] },
          viewer: {
            muted: false,
            followedBy: 'at://did:plc:realperson/app.bsky.graph.follow/1'
          },
          labels: [{ src: 'did:plc:realperson', val: 'x' }],
          createdAt: '2024-01-01T00:00:00.000Z',
          indexedAt: '2024-01-02T00:00:00.000Z'
        },
        'liker',
        1
      )
    ).toEqual({
      did: 'did:plc:likertwo2222222222222222',
      handle: 'liker-two.bsky.social',
      displayName: 'Liker Two',
      description: 'Bio of liker two',
      avatar: 'https://example.com/liker-two/avatar.jpg',
      banner: 'https://example.com/liker-two/banner.jpg',
      viewer: { muted: false, blockedBy: false },
      labels: [],
      createdAt: '2020-01-02T12:00:00.000Z',
      indexedAt: '2020-01-02T12:00:00.000Z'
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

  it('keeps a value that carries no data', () => {
    expect(anonymousBlueskyActor(null, 'liker', 0)).toBeNull();
  });

  it('refuses an entry that is not an actor', () => {
    expect(() => anonymousBlueskyActor(['real'], 'liker', 0)).toThrow(
      `${NOT_ANONYMIZED} liker-one`
    );
  });
});

describe('viewerState', () => {
  const SUBJECT = 'did:plc:gvdogxk4ui5q2nf3rmbz7ytc';

  it('replaces the did of the viewer in the records of the viewer', () => {
    expect(
      viewerState(SUBJECT)(
        {
          muted: false,
          blockedBy: false,
          following:
            'at://did:plc:realviewer/app.bsky.graph.follow/3m2jy7phdqd2b',
          followedBy: `at://${SUBJECT}/app.bsky.graph.follow/3m2jy7phdqd2c`,
          like: 'at://did:plc:realviewer/app.bsky.feed.like/3m2jy7nkcm52b',
          repost: 'at://did:plc:realviewer',
          bookmarked: false
        },
        'viewer'
      )
    ).toEqual({
      muted: false,
      blockedBy: false,
      following: `at://${VIEWER_DID}/app.bsky.graph.follow/3m2jy7phdqd2b`,
      followedBy: `at://${SUBJECT}/app.bsky.graph.follow/3m2jy7phdqd2c`,
      like: `at://${VIEWER_DID}/app.bsky.feed.like/3m2jy7nkcm52b`,
      repost: `at://${VIEWER_DID}`,
      bookmarked: false
    });
  });

  it('drops the people and lists that the viewer knows', () => {
    expect(
      viewerState(SUBJECT)(
        {
          muted: false,
          knownFollowers: {
            count: 1,
            followers: [{ did: 'did:plc:real', handle: 'real.bsky.social' }]
          },
          mutedByList: { uri: 'at://did:plc:real/app.bsky.graph.list/1' },
          activitySubscription: { post: true }
        },
        'viewer'
      )
    ).toEqual({ muted: false });
  });

  it('refuses a record of the viewer that is not an at uri', () => {
    expect(() =>
      viewerState(SUBJECT)({ like: 'https://bsky.app/real' }, 'viewer')
    ).toThrow(`${NOT_ANONYMIZED} like`);
  });

  it('keeps a record of the viewer that carries no data', () => {
    expect(viewerState(SUBJECT)({ like: null }, 'viewer')).toEqual({
      like: null
    });
  });
});
