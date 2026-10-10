import { describe, expect, it } from 'vitest';
import {
  E2E_IP_PREFIX,
  E2E_MAX_ACCOUNTS,
  E2E_MAX_EXTRA_USERS,
  E2E_MAX_INVITES,
  E2E_MAX_LABEL_LENGTH,
  E2E_MAX_PICKER_DRAWS,
  E2E_MAX_PICKER_POSTS,
  E2E_MAX_PICKER_USERS,
  E2E_MAX_PICKER_WINNERS,
  E2E_MAX_SCOPES,
  E2E_MAX_TEXT_LENGTH,
  e2eIntegrationsRequestSchema,
  e2eInvitesRequestSchema,
  e2ePickerRequestSchema,
  e2eUserExtrasRequestSchema,
  toE2eUserNamespace
} from '../extras';

type Schema = {
  safeParse: (value: unknown) => {
    success: boolean;
    data?: unknown;
    error?: { issues: { path: (string | number)[]; message: string }[] };
  };
};

const helpers = (schema: Schema, base: Record<string, unknown>) => ({
  parse: (request: Record<string, unknown>) =>
    schema.safeParse({ ...base, ...request }),
  issuesOf: (request: Record<string, unknown>) =>
    schema
      .safeParse({ ...base, ...request })
      .error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`) ?? [],
  pathsOf: (request: Record<string, unknown>) =>
    schema
      .safeParse({ ...base, ...request })
      .error?.issues.map((i) => i.path.join('.')) ?? []
});

const many = <T>(count: number, make: (index: number) => T) =>
  Array.from({ length: count }, (_, index) => make(index));

const nsOf = (index: number) => `abc123${index.toString().padStart(2, '0')}`;

describe('E2E_IP_PREFIX', () => {
  it('is in the IPv6 documentation prefix, which no real client uses', () => {
    expect(E2E_IP_PREFIX).toBe('2001:db8:e2e:');
  });
});

describe('toE2eUserNamespace', () => {
  it('uses the namespace of the request for a user without one', () => {
    expect(toE2eUserNamespace({ ns: 'abc123' }, {})).toBe('abc123');
    expect(toE2eUserNamespace({ ns: 'abc123' }, { ns: 'abc123p1' })).toBe(
      'abc123p1'
    );
  });
});

describe('e2eUserExtrasRequestSchema', () => {
  const { parse, issuesOf, pathsOf } = helpers(e2eUserExtrasRequestSchema, {
    ns: 'abc123w0'
  });
  const user = (fields: Record<string, unknown> = {}) => ({
    persona: 'participant',
    ...fields
  });

  it('accepts every extra of a user', () => {
    const request = {
      users: [
        user({
          ns: 'abc123p1',
          source: 'TWITTER_IMPORT',
          emailVerified: false,
          birthday: '2010-02-28',
          accounts: [
            {
              identity: 'TWITTER',
              status: 'ERROR',
              scopes: ['tweet.read', 'users.read'],
              label: 'alice'
            },
            { identity: 'GOOGLE', status: 'ACTIVE', scopes: [] }
          ],
          location: {
            country: 'Germany',
            countryCode: 'DE',
            continent: 'Europe',
            continentCode: 'EU',
            region: 'Berlin',
            city: 'Berlin'
          },
          quality: 90,
          turnstile: { success: false, score: 0.1 }
        })
      ]
    };

    expect(parse(request).data).toEqual({ ns: 'abc123w0', ...request });
  });

  it('fills in the defaults of an account', () => {
    expect(
      parse({ users: [user({ accounts: [{ identity: 'DISCORD' }] })] }).data
    ).toEqual({
      ns: 'abc123w0',
      users: [
        user({
          accounts: [{ identity: 'DISCORD', status: 'ACTIVE', scopes: [] }]
        })
      ]
    });
  });

  it('accepts no birthday, to remove it', () => {
    expect(parse({ users: [user({ birthday: null })] }).success).toBe(true);
  });

  it.each(['2010-2-28', '28-02-2010', '2010-02-28T00:00:00Z', '2010-13-45'])(
    'rejects the birthday %s',
    (birthday) => {
      expect(pathsOf({ users: [user({ birthday })] })).toEqual([
        'users.0.birthday'
      ]);
    }
  );

  it('explains a birthday that is not a date', () => {
    expect(issuesOf({ users: [user({ birthday: '2010-13-45' })] })).toEqual([
      'users.0.birthday: Invalid date'
    ]);
    expect(issuesOf({ users: [user({ birthday: 'x2010-02-28' })] })).toEqual([
      'users.0.birthday: Invalid date'
    ]);
    expect(issuesOf({ users: [user({ birthday: ' 2010-02-28' })] })).toEqual([
      'users.0.birthday: Invalid date'
    ]);
  });

  it('rejects two accounts of one identity', () => {
    expect(
      issuesOf({
        users: [
          user({
            accounts: [
              { identity: 'TWITTER' },
              { identity: 'GOOGLE' },
              { identity: 'TWITTER' }
            ]
          })
        ]
      })
    ).toEqual([
      'users.0.accounts.2: Each identity has at most one account for each user'
    ]);
  });

  it(`accepts ${E2E_MAX_ACCOUNTS} accounts and no more`, () => {
    const identities = [
      'TWITTER',
      'GOOGLE',
      'DISCORD',
      'TWITCH',
      'KICK',
      'STEAM'
    ];
    const accounts = identities.map((identity) => ({ identity }));

    expect(
      parse({
        users: [user({ accounts: accounts.slice(0, E2E_MAX_ACCOUNTS) })]
      }).success
    ).toBe(true);
    expect(pathsOf({ users: [user({ accounts })] })).toEqual([
      'users.0.accounts'
    ]);
  });

  it(`accepts ${E2E_MAX_SCOPES} scopes and no more`, () => {
    const scopes = many(E2E_MAX_SCOPES, (index) => `scope${index}`);
    const request = (s: string[]) => ({
      users: [user({ accounts: [{ identity: 'TWITTER', scopes: s }] })]
    });

    expect(parse(request(scopes)).success).toBe(true);
    expect(pathsOf(request([...scopes, 'more']))).toEqual([
      'users.0.accounts.0.scopes'
    ]);
  });

  it.each(['has space', '', 'x'.repeat(101), 'a"b'])(
    'rejects the scope %j',
    (scope) => {
      expect(
        pathsOf({
          users: [
            user({ accounts: [{ identity: 'TWITTER', scopes: [scope] }] })
          ]
        })
      ).toEqual(['users.0.accounts.0.scopes.0']);
    }
  );

  it('accepts the scope characters of the providers', () => {
    expect(
      parse({
        users: [
          user({
            accounts: [
              {
                identity: 'GOOGLE',
                scopes: [
                  'https://www.googleapis.com/auth/userinfo.email',
                  'user:read:email',
                  'guilds.members.read',
                  'offline_access'
                ]
              }
            ]
          })
        ]
      }).success
    ).toBe(true);
  });

  it(`rejects a label longer than ${E2E_MAX_LABEL_LENGTH} characters, or empty`, () => {
    const label = 'x'.repeat(E2E_MAX_LABEL_LENGTH);
    const request = (l: string) => ({
      users: [user({ accounts: [{ identity: 'TWITTER', label: l }] })]
    });

    expect(parse(request(label)).success).toBe(true);
    expect(pathsOf(request(`${label}x`))).toEqual(['users.0.accounts.0.label']);
    expect(pathsOf(request('  '))).toEqual(['users.0.accounts.0.label']);
  });

  it.each(['de', 'DEU', 'D'])('rejects the country code %s', (countryCode) => {
    expect(
      pathsOf({
        users: [user({ location: { country: 'Germany', countryCode } })]
      })
    ).toEqual(['users.0.location.countryCode']);
  });

  it.each(['eu', 'EUR'])('rejects the continent code %s', (continentCode) => {
    expect(
      pathsOf({
        users: [
          user({
            location: { country: 'Germany', countryCode: 'DE', continentCode }
          })
        ]
      })
    ).toEqual(['users.0.location.continentCode']);
  });

  it('rejects a location without a country, and an unknown field', () => {
    expect(
      pathsOf({ users: [user({ location: { countryCode: 'DE' } })] })
    ).toEqual(['users.0.location.country']);
    expect(
      pathsOf({
        users: [
          user({
            location: { country: 'Germany', countryCode: 'DE', ip: '1.2.3.4' }
          })
        ]
      })
    ).toEqual(['users.0.location']);
  });

  it('rejects a score outside 0 to 100, and a Turnstile score outside 0 to 1', () => {
    expect(pathsOf({ users: [user({ quality: 101 })] })).toEqual([
      'users.0.quality'
    ]);
    expect(pathsOf({ users: [user({ quality: -1 })] })).toEqual([
      'users.0.quality'
    ]);
    expect(
      pathsOf({ users: [user({ turnstile: { success: true, score: 1.5 } })] })
    ).toEqual(['users.0.turnstile.score']);
    expect(
      pathsOf({ users: [user({ turnstile: { success: true, score: -0.5 } })] })
    ).toEqual(['users.0.turnstile.score']);
    expect(
      pathsOf({ users: [user({ turnstile: { success: true, token: 'x' } })] })
    ).toEqual(['users.0.turnstile']);
  });

  it('rejects an unknown source and an unknown field', () => {
    expect(pathsOf({ users: [user({ source: 'MYSPACE_IMPORT' })] })).toEqual([
      'users.0.source'
    ]);
    expect(pathsOf({ users: [user({ email: 'a@b.c' })] })).toEqual(['users.0']);
  });

  it('rejects a namespace outside the run', () => {
    expect(issuesOf({ users: [user({ ns: 'xyz789' })] })).toEqual([
      'users.0.ns: The namespace must start with abc123'
    ]);
  });

  it('rejects a persona twice in one namespace', () => {
    expect(
      issuesOf({
        users: [user(), user({ persona: 'host' }), user({ ns: 'abc123w0' })]
      })
    ).toEqual(['users.2: Each persona and namespace appears at most once']);
  });

  it(`accepts 1 to ${E2E_MAX_EXTRA_USERS} users`, () => {
    const users = many(E2E_MAX_EXTRA_USERS, (index) =>
      user({ ns: nsOf(index) })
    );

    expect(parse({ users }).success).toBe(true);
    expect(pathsOf({ users: [...users, user({ ns: 'abc123zz' })] })).toEqual([
      'users'
    ]);
    expect(pathsOf({ users: [] })).toEqual(['users']);
  });
});

describe('e2eIntegrationsRequestSchema', () => {
  const { parse, issuesOf, pathsOf } = helpers(e2eIntegrationsRequestSchema, {
    team: 'e2e-abc123-w0'
  });

  it('fills in the defaults of an integration', () => {
    expect(parse({ integrations: [{ provider: 'TWITTER' }] }).data).toEqual({
      team: 'e2e-abc123-w0',
      integrations: [{ provider: 'TWITTER', status: 'ACTIVE' }]
    });
  });

  it('accepts one integration of each provider with its fields', () => {
    const integrations = [
      { provider: 'TWITTER', status: 'ERROR', label: 'e2e_x', scopes: [] },
      { provider: 'BLUESKY', status: 'ACTIVE', settings: { a: 1 } },
      { provider: 'DISCORD', status: 'ACTIVE' },
      {
        provider: 'TWITCH',
        status: 'ACTIVE',
        settings: {
          broadcasterId: '1',
          broadcasterLogin: 'e2e',
          broadcasterDisplayName: 'E2E',
          channelUrl: 'https://www.twitch.tv/e2e'
        }
      }
    ];

    expect(parse({ integrations }).data).toEqual({
      team: 'e2e-abc123-w0',
      integrations
    });
  });

  it('rejects a PENDING integration', () => {
    expect(
      pathsOf({ integrations: [{ provider: 'TWITTER', status: 'PENDING' }] })
    ).toEqual(['integrations.0.status']);
  });

  it('rejects Twitch settings that the app cannot read', () => {
    const message =
      'integrations.0.settings: Twitch settings need broadcasterId, broadcasterLogin, broadcasterDisplayName and channelUrl';

    expect(
      issuesOf({
        integrations: [{ provider: 'TWITCH', settings: { broadcasterId: '1' } }]
      })
    ).toEqual([message]);
    expect(
      issuesOf({
        integrations: [
          {
            provider: 'TWITCH',
            settings: {
              broadcasterId: '1',
              broadcasterLogin: 'e2e',
              broadcasterDisplayName: 'E2E',
              channelUrl: 'https://www.twitch.tv/e2e',
              extra: true
            }
          }
        ]
      })
    ).toEqual([message]);
  });

  it('accepts any settings object for the other providers', () => {
    expect(
      parse({
        integrations: [{ provider: 'DISCORD', settings: { broadcasterId: 1 } }]
      }).success
    ).toBe(true);
  });

  it('rejects two integrations of one provider', () => {
    expect(
      issuesOf({
        integrations: [
          { provider: 'TWITTER' },
          { provider: 'DISCORD' },
          { provider: 'TWITTER' }
        ]
      })
    ).toEqual([
      'integrations.2: Each provider has at most one integration for each team'
    ]);
  });

  it('rejects no integration, an unknown provider and a team outside e2e', () => {
    expect(pathsOf({ integrations: [] })).toEqual(['integrations']);
    expect(pathsOf({ integrations: [{ provider: 'MYSPACE' }] })).toEqual([
      'integrations.0.provider'
    ]);
    expect(
      pathsOf({ team: 'acme', integrations: [{ provider: 'TWITTER' }] })
    ).toEqual(['team']);
  });
});

describe('e2eInvitesRequestSchema', () => {
  const { parse, issuesOf, pathsOf } = helpers(e2eInvitesRequestSchema, {
    ns: 'abc123w0',
    team: 'e2e-abc123-w0'
  });

  it('fills in the defaults', () => {
    expect(parse({}).data).toEqual({
      ns: 'abc123w0',
      team: 'e2e-abc123-w0',
      emails: []
    });
    expect(parse({ link: {} }).data).toMatchObject({
      link: { expiresIn: null }
    });
  });

  it('accepts invites in each role and an expired link', () => {
    const request = {
      emails: [
        { persona: 'admin', role: 'ADMIN' },
        { persona: 'member', ns: 'abc123p1', role: 'MEMBER' },
        { persona: 'guest', role: 'GUEST' }
      ],
      link: { expiresIn: -60 }
    };

    expect(parse(request).data).toEqual({
      ns: 'abc123w0',
      team: 'e2e-abc123-w0',
      ...request
    });
  });

  it('rejects an OWNER or BLOCKED invite', () => {
    expect(pathsOf({ emails: [{ persona: 'admin', role: 'OWNER' }] })).toEqual([
      'emails.0.role'
    ]);
    expect(
      pathsOf({ emails: [{ persona: 'admin', role: 'BLOCKED' }] })
    ).toEqual(['emails.0.role']);
  });

  it('rejects a namespace outside the run and a persona invited twice', () => {
    expect(
      issuesOf({ emails: [{ persona: 'admin', ns: 'xyz789', role: 'ADMIN' }] })
    ).toEqual(['emails.0.ns: The namespace must start with abc123']);
    expect(
      issuesOf({
        emails: [
          { persona: 'admin', role: 'ADMIN' },
          { persona: 'admin', ns: 'abc123w0', role: 'MEMBER' }
        ]
      })
    ).toEqual(['emails.1: Each persona and namespace is invited at most once']);
  });

  it(`accepts ${E2E_MAX_INVITES} invites and no more`, () => {
    const emails = many(E2E_MAX_INVITES, (index) => ({
      persona: 'admin',
      ns: nsOf(index),
      role: 'ADMIN'
    }));

    expect(parse({ emails }).success).toBe(true);
    expect(
      pathsOf({
        emails: [...emails, { persona: 'admin', ns: 'abc123zz', role: 'ADMIN' }]
      })
    ).toEqual(['emails']);
  });

  it('rejects an expiry beyond a year and an unknown field of the link', () => {
    expect(pathsOf({ link: { expiresIn: 367 * 24 * 3600 } })).toEqual([
      'link.expiresIn'
    ]);
    expect(pathsOf({ link: { expiresIn: -367 * 24 * 3600 } })).toEqual([
      'link.expiresIn'
    ]);
    expect(pathsOf({ link: { code: 'abc' } })).toEqual(['link']);
  });
});

describe('e2ePickerRequestSchema', () => {
  const { parse, issuesOf, pathsOf } = helpers(e2ePickerRequestSchema, {
    team: 'e2e-abc123-w0'
  });

  it('fills in the defaults', () => {
    expect(parse({}).data).toEqual({
      team: 'e2e-abc123-w0',
      status: 'COMPLETE',
      winners: 1,
      users: [],
      posts: [],
      draws: []
    });
  });

  it('accepts a picker in any status with its filters, users, posts and draws', () => {
    const request = {
      status: 'PROCESSING',
      winners: 2,
      runIn: -60,
      minPostCount: 10,
      minAccountAgeDays: 30,
      minFollowersCount: 5,
      minFollowingCount: 0,
      requireProfileImage: true,
      requireBannerImage: false,
      requireLocation: true,
      requireBio: false,
      lastPostWithin: 'PAST_WEEK',
      users: [
        {
          username: 'alice_1',
          name: 'Alice',
          description: 'Hi',
          location: 'Berlin',
          profileImageUrl: 'https://example.com/a.png',
          bannerImageUrl: 'https://example.com/b.png',
          createdDaysAgo: 400,
          followersCount: 10,
          followingCount: 20,
          tweetCount: 300,
          verified: true,
          canDm: false
        },
        { username: 'bob' }
      ],
      posts: [
        {
          text: 'Win!',
          favoriteCount: 1,
          retweetCount: 2,
          replyCount: 3,
          quoteCount: 4,
          viewCount: 5
        }
      ],
      draws: [{ user: 0, disqualified: 'Bot' }, { user: 1 }]
    };

    expect(parse(request).data).toEqual({ team: 'e2e-abc123-w0', ...request });
  });

  it('rejects a draw of a user that does not exist', () => {
    expect(
      issuesOf({ users: [{ username: 'bob' }], draws: [{ user: 1 }] })
    ).toEqual(['draws.0.user: There is no user at index 1']);
  });

  it.each(['has space', 'x'.repeat(16), '', 'dash-ed'])(
    'rejects the username %j',
    (username) => {
      expect(pathsOf({ users: [{ username }] })).toEqual(['users.0.username']);
    }
  );

  it(`rejects a text longer than ${E2E_MAX_TEXT_LENGTH} characters`, () => {
    const text = 'x'.repeat(E2E_MAX_TEXT_LENGTH);

    expect(parse({ posts: [{ text }] }).success).toBe(true);
    expect(pathsOf({ posts: [{ text: `${text}x` }] })).toEqual([
      'posts.0.text'
    ]);
  });

  it('rejects a negative count, an unknown status and an unknown field', () => {
    expect(pathsOf({ posts: [{ retweetCount: -1 }] })).toEqual([
      'posts.0.retweetCount'
    ]);
    expect(pathsOf({ status: 'DONE' })).toEqual(['status']);
    expect(pathsOf({ runId: 'r-1' })).toEqual(['']);
  });

  it(`accepts 1 to ${E2E_MAX_PICKER_WINNERS} winners`, () => {
    expect(parse({ winners: E2E_MAX_PICKER_WINNERS }).success).toBe(true);
    expect(pathsOf({ winners: E2E_MAX_PICKER_WINNERS + 1 })).toEqual([
      'winners'
    ]);
    expect(pathsOf({ winners: 0 })).toEqual(['winners']);
  });

  it('accepts the limits of users, posts and draws and no more', () => {
    const users = many(E2E_MAX_PICKER_USERS, (index) => ({
      username: `u${index}`
    }));
    const posts = many(E2E_MAX_PICKER_POSTS, () => ({}));
    const draws = many(E2E_MAX_PICKER_DRAWS, () => ({ user: 0 }));

    expect(parse({ users, posts, draws }).success).toBe(true);
    expect(pathsOf({ users: [...users, { username: 'x' }] })).toEqual([
      'users'
    ]);
    expect(pathsOf({ posts: [...posts, {}] })).toEqual(['posts']);
    expect(pathsOf({ users, draws: [...draws, { user: 0 }] })).toEqual([
      'draws'
    ]);
  });
});
