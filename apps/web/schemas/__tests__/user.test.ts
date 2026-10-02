import { describe, it, expect } from 'vitest';
import {
  userProfileSchema,
  userSchema,
  engagedUserSchema,
  parseProviders,
  parseProvider,
  createUserProfileSchema,
  updateUserProfileSchema,
  blueskyHandleSchema,
  USER_SCHEMA_SELECT_QUERY,
  toUserSchema,
  userDetailsTabSchema,
  USER_DETAILS_TAB_OPTIONS,
  isUserDetailsTab,
  isAnonymousUser,
  type UserAccounts,
  type UserSchema
} from '../user';
import { ApplicationError } from '@/lib/errors';
import {
  buildUserPayload,
  FIXED_CREATED_AT
} from './fixtures-schemas-core-and-scoring';

const validProfile = {
  id: 'user-1',
  name: 'Jane',
  email: 'jane@example.com',
  emailVerified: true,
  image: 'https://example.com/jane.png',
  countryCode: 'CA',
  userAgent: 'agent-1',
  birthday: '1990-05-01T00:00:00.000Z',
  qualityScore: 72,
  providers: [{ type: 'GOOGLE', scopes: ['email'], label: 'Google' }],
  source: 'SIGNUP',
  preferredContactMethod: null
};

const account = (overrides: Partial<UserAccounts> = {}): UserAccounts => ({
  provider: 'google',
  scope: 'openid email',
  label: 'Personal',
  link: 'https://example.com',
  status: 'ACTIVE',
  ...overrides
});

const buildUser = (overrides: Partial<UserSchema> = {}): UserSchema => ({
  id: 'user-1',
  name: 'Jane',
  email: 'jane@example.com',
  emailVerified: true,
  image: null,
  countryCode: 'CA',
  userAgent: 'agent-1',
  birthday: null,
  qualityScore: 50,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  createdAt: FIXED_CREATED_AT,
  isAnonymous: false,
  ...overrides
});

const issueMessages = (result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) => result.error?.issues.map((issue) => issue.message) ?? [];

describe('userProfileSchema', () => {
  describe('when the profile is valid', () => {
    it('coerces the birthday string into a Date', () => {
      const parsed = userProfileSchema.parse(validProfile);

      expect(parsed.birthday).toEqual(new Date('1990-05-01T00:00:00.000Z'));
    });

    it('defaults provider status to ACTIVE', () => {
      const parsed = userProfileSchema.parse(validProfile);

      expect(parsed.providers).toEqual([
        { type: 'GOOGLE', scopes: ['email'], label: 'Google', status: 'ACTIVE' }
      ]);
    });

    it('keeps a valid image URL unchanged', () => {
      const parsed = userProfileSchema.parse(validProfile);

      expect(parsed.image).toBe('https://example.com/jane.png');
    });

    it('accepts a null birthday', () => {
      const parsed = userProfileSchema.parse({
        ...validProfile,
        birthday: null
      });

      expect(parsed.birthday).toBeNull();
    });

    it('accepts the optional username, onboarded and accountType fields', () => {
      const parsed = userProfileSchema.parse({
        ...validProfile,
        username: 'jane',
        onboarded: true,
        accountType: 'HOST'
      });

      expect(parsed).toMatchObject({
        username: 'jane',
        onboarded: true,
        accountType: 'HOST'
      });
    });

    it('accepts a null username', () => {
      const parsed = userProfileSchema.parse({
        ...validProfile,
        username: null
      });

      expect(parsed.username).toBeNull();
    });

    it('accepts null for every nullable profile field', () => {
      const parsed = userProfileSchema.parse({
        ...validProfile,
        name: null,
        email: null,
        emailVerified: null,
        image: null,
        countryCode: null,
        userAgent: null,
        birthday: null,
        preferredContactMethod: null
      });

      expect(parsed).toMatchObject({
        name: null,
        email: null,
        emailVerified: null,
        image: null,
        countryCode: null,
        userAgent: null,
        birthday: null,
        preferredContactMethod: null
      });
    });

    it('accepts an empty provider list', () => {
      expect(
        userProfileSchema.parse({ ...validProfile, providers: [] }).providers
      ).toEqual([]);
    });
  });

  describe('image transform', () => {
    it('turns a null image into null', () => {
      const parsed = userProfileSchema.parse({ ...validProfile, image: null });

      expect(parsed.image).toBeNull();
    });

    it('turns an empty image string into null', () => {
      const parsed = userProfileSchema.parse({ ...validProfile, image: '' });

      expect(parsed.image).toBeNull();
    });

    it('turns an unparseable image URL into null instead of failing', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        image: 'not a url'
      });

      expect(result.success).toBe(true);
      expect(result.data?.image).toBeNull();
    });
  });

  describe('when the profile is invalid', () => {
    it('rejects an invalid email address', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        email: 'not-an-email'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['email']);
    });

    it('rejects an unknown user source', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        source: 'SCRAPED'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['source']);
    });

    it('rejects an unknown preferred contact method', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        preferredContactMethod: 'PIGEON'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['preferredContactMethod']);
    });

    it('rejects a missing preferred contact method', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        preferredContactMethod: undefined
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['preferredContactMethod']);
    });

    it('rejects an invalid account type', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        accountType: 'ADMIN'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['accountType']);
    });

    it('rejects a quality score given as a string', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        qualityScore: '72'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['qualityScore']);
    });

    it('rejects a non-boolean emailVerified', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        emailVerified: '2026-01-16T00:00:00.000Z'
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['emailVerified']);
    });

    it('rejects a provider with an unknown type', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        providers: [{ type: 'MYSPACE', scopes: [], label: 'Old' }]
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['providers', 0, 'type']);
    });

    it('rejects a missing id', () => {
      const result = userProfileSchema.safeParse({
        ...validProfile,
        id: undefined
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['id']);
    });
  });
});

describe('userSchema', () => {
  it('adds createdAt (coerced) and isAnonymous to the profile', () => {
    const parsed = userSchema.parse({
      ...validProfile,
      createdAt: '2026-01-15T10:00:00.000Z',
      isAnonymous: false
    });

    expect(parsed.createdAt).toEqual(FIXED_CREATED_AT);
    expect(parsed.isAnonymous).toBe(false);
  });

  it('rejects a profile without isAnonymous', () => {
    const result = userSchema.safeParse({
      ...validProfile,
      createdAt: '2026-01-15T10:00:00.000Z'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['isAnonymous']);
  });
});

describe('engagedUserSchema', () => {
  it('requires a numeric engagement on top of the user fields', () => {
    const base = {
      ...validProfile,
      createdAt: '2026-01-15T10:00:00.000Z',
      isAnonymous: false
    };

    expect(
      engagedUserSchema.safeParse({ ...base, engagement: 3 }).success
    ).toBe(true);
    expect(engagedUserSchema.safeParse(base).success).toBe(false);
  });
});

describe('parseProviders', () => {
  it('returns an empty array for no accounts', () => {
    expect(parseProviders([])).toEqual([]);
  });

  it('maps an auth provider string to its identity provider type', () => {
    const [provider] = parseProviders([account({ provider: 'twitter' })]);

    expect(provider.type).toBe('TWITTER');
  });

  it('maps every account into a provider entry', () => {
    const result = parseProviders([
      account({ provider: 'google', status: 'ACTIVE' }),
      account({ provider: 'discord', status: 'ERROR' })
    ]);

    expect(result).toEqual([
      {
        type: 'GOOGLE',
        scopes: ['openid', 'email'],
        label: 'Personal',
        link: 'https://example.com',
        status: 'ACTIVE'
      },
      {
        type: 'DISCORD',
        scopes: ['openid', 'email'],
        label: 'Personal',
        link: 'https://example.com',
        status: 'ERROR'
      }
    ]);
  });

  it('splits scopes on spaces and commas and drops empty entries', () => {
    const [provider] = parseProviders([
      account({ scope: ' read,write  , tweet.read\tusers.read ,,' })
    ]);

    expect(provider.scopes).toEqual([
      'read',
      'write',
      'tweet.read',
      'users.read'
    ]);
  });

  it('returns no scopes when the scope is null', () => {
    const [provider] = parseProviders([account({ scope: null })]);

    expect(provider.scopes).toEqual([]);
  });

  it('returns no scopes when the scope is an empty string', () => {
    const [provider] = parseProviders([account({ scope: '' })]);

    expect(provider.scopes).toEqual([]);
  });

  it("falls back to 'N/A' when the label is missing", () => {
    const [provider] = parseProviders([account({ label: null })]);

    expect(provider.label).toBe('N/A');
  });

  it("falls back to 'N/A' when the label is an empty string", () => {
    const [provider] = parseProviders([account({ label: '' })]);

    expect(provider.label).toBe('N/A');
  });

  it('falls back to an empty link when the link is missing', () => {
    const [provider] = parseProviders([account({ link: null })]);

    expect(provider.link).toBe('');
  });

  it('throws instead of falling back to EMAIL for an unknown auth provider', () => {
    let caught: unknown;
    try {
      parseProviders([account({ provider: 'myspace' })]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApplicationError);
    expect(caught).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Unsupported provider unknown'
    });
  });

  it('rejects an uppercase identity provider name because only auth provider ids are mapped', () => {
    expect(() => parseProviders([account({ provider: 'GOOGLE' })])).toThrow(
      'Unsupported provider unknown'
    );
  });

  it.each([
    ['email', 'EMAIL'],
    ['anonymous', 'ANONYMOUS'],
    ['bluesky', 'BLUESKY'],
    ['linkedin', 'LINKEDIN']
  ])('maps the auth provider %s to %s', (provider, expected) => {
    const [result] = parseProviders([account({ provider })]);

    expect(result.type).toBe(expected);
  });
});

describe('parseProvider', () => {
  it('returns a valid identity provider unchanged', () => {
    expect(parseProvider('BLUESKY')).toBe('BLUESKY');
  });

  it('throws a VALIDATION_ERROR naming the unsupported provider', () => {
    let caught: unknown;
    try {
      parseProvider('MYSPACE');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApplicationError);
    expect(caught).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Unsupported provider MYSPACE'
    });
  });

  it.each([null, undefined, ''])(
    "reports 'unknown' when the provider is %j",
    (value) => {
      expect(() => parseProvider(value)).toThrow(
        'Unsupported provider unknown'
      );
    }
  );

  it('is case sensitive', () => {
    expect(() => parseProvider('google')).toThrow(
      'Unsupported provider google'
    );
  });
});

describe('createUserProfileSchema', () => {
  it('accepts any string name', () => {
    expect(createUserProfileSchema.parse({ name: '' })).toEqual({ name: '' });
  });

  it('rejects a missing name', () => {
    expect(createUserProfileSchema.safeParse({}).success).toBe(false);
  });
});

describe('updateUserProfileSchema', () => {
  it('accepts an empty object because every field is optional', () => {
    expect(updateUserProfileSchema.parse({})).toEqual({});
  });

  it('accepts a five character name with spaces, hyphens and underscores', () => {
    expect(updateUserProfileSchema.parse({ name: 'a b-_' })).toEqual({
      name: 'a b-_'
    });
  });

  it('rejects a name shorter than five characters', () => {
    const result = updateUserProfileSchema.safeParse({ name: 'abcd' });

    expect(issueMessages(result)).toEqual([
      'Username must be at least 5 characters'
    ]);
  });

  it('rejects a name with disallowed characters', () => {
    const result = updateUserProfileSchema.safeParse({ name: 'jane.doe' });

    expect(issueMessages(result)).toEqual([
      'Username can only contain letters, numbers, spaces, hyphens, and underscores'
    ]);
  });

  it('accepts a null image', () => {
    expect(updateUserProfileSchema.parse({ image: null })).toEqual({
      image: null
    });
  });

  it('rejects an image that is not a URL', () => {
    expect(updateUserProfileSchema.safeParse({ image: 'nope' }).success).toBe(
      false
    );
  });

  it('accepts a null preferred contact method', () => {
    expect(
      updateUserProfileSchema.parse({ preferredContactMethod: null })
    ).toEqual({ preferredContactMethod: null });
  });

  it('rejects an unknown preferred contact method', () => {
    expect(
      updateUserProfileSchema.safeParse({ preferredContactMethod: 'FAX' })
        .success
    ).toBe(false);
  });
});

describe('blueskyHandleSchema', () => {
  it.each(['user.bsky.social', 'a.b', 'my-name.example.com', 'A1.B2'])(
    'accepts the domain-style handle %s',
    (handle) => {
      expect(blueskyHandleSchema.safeParse(handle).success).toBe(true);
    }
  );

  it('accepts a 63 character label', () => {
    expect(
      blueskyHandleSchema.safeParse(`${'a'.repeat(63)}.bsky.social`).success
    ).toBe(true);
  });

  it('rejects a 64 character label', () => {
    expect(
      blueskyHandleSchema.safeParse(`${'a'.repeat(64)}.bsky.social`).success
    ).toBe(false);
  });

  it.each([
    'username',
    '-user.bsky.social',
    'user-.bsky.social',
    'user.bsky.social.',
    '@user.bsky.social',
    'user..bsky.social'
  ])('rejects the malformed handle %s', (handle) => {
    const result = blueskyHandleSchema.safeParse(handle);

    expect(issueMessages(result)).toEqual([
      'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)'
    ]);
  });

  it('reports both the required and format errors for an empty handle', () => {
    const result = blueskyHandleSchema.safeParse('');

    expect(issueMessages(result)).toEqual([
      'Bluesky handle is required',
      'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)'
    ]);
  });
});

describe('USER_SCHEMA_SELECT_QUERY', () => {
  it('selects only the latest agent, ip and quality entries', () => {
    expect(USER_SCHEMA_SELECT_QUERY.agents).toEqual({
      include: { agent: true },
      take: 1,
      orderBy: { updatedAt: 'desc' }
    });
    expect(USER_SCHEMA_SELECT_QUERY.ips).toEqual({
      include: { ip: true },
      take: 1,
      orderBy: { updatedAt: 'desc' }
    });
    expect(USER_SCHEMA_SELECT_QUERY.quality).toEqual({
      take: 1,
      orderBy: { updatedAt: 'desc' }
    });
  });

  it('selects the account fields needed to build providers', () => {
    expect(USER_SCHEMA_SELECT_QUERY.accounts).toEqual({
      select: {
        provider: true,
        scope: true,
        label: true,
        link: true,
        status: true
      }
    });
  });

  it('selects the scalar user fields', () => {
    expect(USER_SCHEMA_SELECT_QUERY).toMatchObject({
      id: true,
      email: true,
      name: true,
      image: true,
      source: true,
      createdAt: true,
      birthday: true,
      emailVerified: true,
      onboarded: true,
      accountType: true,
      username: true,
      preferredContactMethod: true
    });
  });
});

describe('toUserSchema', () => {
  describe('when the user has full data', () => {
    it('maps the payload into a user schema', () => {
      expect(toUserSchema(buildUserPayload())).toEqual({
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane',
        image: 'https://example.com/jane.png',
        source: 'SIGNUP',
        birthday: new Date('1990-05-01T00:00:00.000Z'),
        createdAt: FIXED_CREATED_AT,
        countryCode: 'CA',
        userAgent: 'agent-1',
        qualityScore: 72,
        emailVerified: true,
        providers: [
          {
            type: 'GOOGLE',
            scopes: ['openid', 'email'],
            label: 'jane@example.com',
            link: 'https://mail.google.com',
            status: 'ACTIVE'
          }
        ],
        onboarded: true,
        accountType: 'PARTICIPANT',
        username: 'jane_doe',
        preferredContactMethod: 'GOOGLE',
        isAnonymous: false
      });
    });

    it('passes the onboarding fields through unchanged', () => {
      const user = toUserSchema(
        buildUserPayload({
          onboarded: false,
          accountType: 'HOST',
          username: null,
          name: null,
          email: null,
          birthday: null,
          source: 'DISCORD_IMPORT'
        })
      );

      expect(user).toMatchObject({
        onboarded: false,
        accountType: 'HOST',
        username: null,
        name: null,
        email: null,
        birthday: null,
        source: 'DISCORD_IMPORT'
      });
    });

    it('uses the device agent id rather than the user agent string', () => {
      const user = toUserSchema(buildUserPayload());

      expect(user.userAgent).toBe('agent-1');
    });

    it('produces output that satisfies userSchema', () => {
      expect(
        userSchema.safeParse(toUserSchema(buildUserPayload())).success
      ).toBe(true);
    });
  });

  describe('fallbacks', () => {
    it("uses 'XX' when the user has no IP addresses", () => {
      const user = toUserSchema(buildUserPayload({ ips: [] }));

      expect(user.countryCode).toBe('XX');
    });

    it("uses 'XX' when the latest IP has no country code", () => {
      const payload = buildUserPayload();
      payload.ips[0].ip.countryCode = null;

      expect(toUserSchema(payload).countryCode).toBe('XX');
    });

    it("uses 'XX' when the latest IP has an empty country code", () => {
      const payload = buildUserPayload();
      payload.ips[0].ip.countryCode = '';

      expect(toUserSchema(payload).countryCode).toBe('XX');
    });

    it("uses 'unknown' when the user has no agents", () => {
      const user = toUserSchema(buildUserPayload({ agents: [] }));

      expect(user.userAgent).toBe('unknown');
    });

    it('uses a quality score of 0 when the user has no quality entries', () => {
      const user = toUserSchema(buildUserPayload({ quality: [] }));

      expect(user.qualityScore).toBe(0);
    });

    it('converts a null emailVerified into false', () => {
      const user = toUserSchema(buildUserPayload({ emailVerified: null }));

      expect(user.emailVerified).toBe(false);
    });

    it('converts an undefined preferred contact method into null', () => {
      const user = toUserSchema(
        buildUserPayload({
          preferredContactMethod: undefined as unknown as null
        })
      );

      expect(user.preferredContactMethod).toBeNull();
    });

    it('marks a user without accounts as anonymous with no providers', () => {
      const user = toUserSchema(buildUserPayload({ accounts: [] }));

      expect(user.isAnonymous).toBe(true);
      expect(user.providers).toEqual([]);
    });
  });

  describe('quality score clamping', () => {
    it.each([
      [150, 100],
      [100, 100],
      [0, 0],
      [-20, 0],
      [55, 55]
    ])('clamps a stored score of %i to %i', (stored, expected) => {
      const payload = buildUserPayload();
      payload.quality[0].score = stored;

      expect(toUserSchema(payload).qualityScore).toBe(expected);
    });
  });

  describe('image sanitizing', () => {
    it('drops an image that is not a valid URL', () => {
      const user = toUserSchema(buildUserPayload({ image: '/relative.png' }));

      expect(user.image).toBeNull();
    });

    it('returns null for a null image', () => {
      const user = toUserSchema(buildUserPayload({ image: null }));

      expect(user.image).toBeNull();
    });

    it('returns null for an empty image', () => {
      const user = toUserSchema(buildUserPayload({ image: '' }));

      expect(user.image).toBeNull();
    });
  });
});

describe('userDetailsTabSchema', () => {
  it.each(['overview', 'entries'])('accepts %s', (tab) => {
    expect(userDetailsTabSchema.safeParse(tab).success).toBe(true);
  });

  it('rejects other tabs', () => {
    expect(userDetailsTabSchema.safeParse('history').success).toBe(false);
  });
});

describe('USER_DETAILS_TAB_OPTIONS', () => {
  it('labels every tab', () => {
    expect(USER_DETAILS_TAB_OPTIONS).toEqual({
      overview: 'Overview',
      entries: 'Entries'
    });
  });
});

describe('isUserDetailsTab', () => {
  it('returns true for a known tab', () => {
    expect(isUserDetailsTab('entries')).toBe(true);
  });

  it('returns false for an unknown tab', () => {
    expect(isUserDetailsTab('Entries')).toBe(false);
  });
});

describe('isAnonymousUser', () => {
  it('returns false for a null user', () => {
    expect(isAnonymousUser(null)).toBe(false);
  });

  it('returns false for an undefined user', () => {
    expect(isAnonymousUser(undefined)).toBe(false);
  });

  it('returns true when the user has no providers', () => {
    expect(isAnonymousUser(buildUser({ providers: [] }))).toBe(true);
  });

  it('returns true when one of the providers is ANONYMOUS', () => {
    const user = buildUser({
      providers: [
        { type: 'GOOGLE', scopes: [], label: 'Google', status: 'ACTIVE' },
        { type: 'ANONYMOUS', scopes: [], label: 'Anon', status: 'ACTIVE' }
      ]
    });

    expect(isAnonymousUser(user)).toBe(true);
  });

  it('returns false when every provider is a real identity', () => {
    const user = buildUser({
      providers: [
        { type: 'GOOGLE', scopes: [], label: 'Google', status: 'ACTIVE' }
      ]
    });

    expect(isAnonymousUser(user)).toBe(false);
  });

  it('ignores the isAnonymous flag and only looks at providers', () => {
    const user = buildUser({
      isAnonymous: true,
      providers: [
        { type: 'DISCORD', scopes: [], label: 'Discord', status: 'ACTIVE' }
      ]
    });

    expect(isAnonymousUser(user)).toBe(false);
  });
});
