import { describe, it, expect } from 'vitest';
import { IdentityProvider } from '@prisma/client';
import { ZodError } from 'zod';
import {
  identityProviderSchema,
  PROVIDER_REQUIRED_SCOPES,
  isMissingScopes,
  isProviderType,
  providerSchema,
  IDENTITY_PROVIDER_LABEL,
  IS_SOCIAL_PROVIDER,
  ENABLED_IDENTITY_PROVIDERS,
  LOGIN_PROVIDERS,
  SOCIAL_PROVIDERS,
  isIdentityProvider,
  authProviderSchema,
  parseAuthProvider,
  IDENTITY_PROVIDER_TO_AUTH_PROVIDER,
  AUTH_PROVIDER_TO_IDENTITY_PROVIDER,
  doesUserHaveAllowedIdentity,
  type ProviderSchema
} from '../providers';
import {
  REQUIRED_BLUESKY_SCOPES,
  REQUIRED_DISCORD_SCOPES,
  REQUIRED_TWITTER_SCOPES,
  REQUIRED_STEAM_SCOPES,
  REQUIRED_GMAIL_SCOPES,
  REQUIRED_TWITCH_SCOPES,
  REQUIRED_KICK_SCOPES,
  REQUIRED_TIKTOK_SCOPES,
  REQUIRED_VELORA_SCOPES,
  REQUIRED_LINKEDIN_SCOPES
} from '../../scopes';
import { ApplicationError } from '@/lib/errors';

const ALL_IDENTITY_PROVIDERS = Object.values(IdentityProvider);

const provider = (overrides: Partial<ProviderSchema> = {}): ProviderSchema => ({
  type: 'TWITTER',
  scopes: [],
  label: '@giveawaydog',
  status: 'ACTIVE',
  ...overrides
});

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('identityProviderSchema', () => {
  it.each(ALL_IDENTITY_PROVIDERS)('accepts %s', (value) => {
    expect(identityProviderSchema.parse(value)).toBe(value);
  });

  it.each(['twitter', 'GITHUB', '', null])('rejects %j', (value) => {
    expect(identityProviderSchema.safeParse(value).success).toBe(false);
  });
});

describe('PROVIDER_REQUIRED_SCOPES', () => {
  it('has an entry for every identity provider', () => {
    expect(Object.keys(PROVIDER_REQUIRED_SCOPES).sort()).toEqual(
      [...ALL_IDENTITY_PROVIDERS].sort()
    );
  });

  it.each(['EMAIL', 'YOUTUBE', 'INSTAGRAM', 'ANONYMOUS', 'FACEBOOK'] as const)(
    'requires no scopes for %s',
    (key) => {
      expect(PROVIDER_REQUIRED_SCOPES[key]).toEqual([]);
    }
  );

  it.each([
    ['BLUESKY', REQUIRED_BLUESKY_SCOPES],
    ['DISCORD', REQUIRED_DISCORD_SCOPES],
    ['TWITTER', REQUIRED_TWITTER_SCOPES],
    ['STEAM', REQUIRED_STEAM_SCOPES],
    ['GOOGLE', REQUIRED_GMAIL_SCOPES],
    ['TWITCH', REQUIRED_TWITCH_SCOPES],
    ['KICK', REQUIRED_KICK_SCOPES],
    ['TIKTOK', REQUIRED_TIKTOK_SCOPES],
    ['VELORA', REQUIRED_VELORA_SCOPES],
    ['LINKEDIN', REQUIRED_LINKEDIN_SCOPES]
  ] as const)('uses the shared required scopes list for %s', (key, scopes) => {
    expect(PROVIDER_REQUIRED_SCOPES[key]).toBe(scopes);
  });
});

describe('isMissingScopes', () => {
  it('returns false when the provider has every required scope', () => {
    expect(
      isMissingScopes(provider({ scopes: ['a', 'b', 'c'] }), ['a', 'b'])
    ).toBe(false);
  });

  it('returns true when the provider lacks one of the required scopes', () => {
    expect(isMissingScopes(provider({ scopes: ['a'] }), ['a', 'b'])).toBe(true);
  });

  it('returns false when no scopes are required', () => {
    expect(isMissingScopes(provider({ scopes: [] }), [])).toBe(false);
  });

  it('returns false when no scopes are required and the provider is missing', () => {
    expect(isMissingScopes(null, [])).toBe(false);
  });

  it('returns true when scopes are required but the provider is null', () => {
    expect(isMissingScopes(null, ['a'])).toBe(true);
  });

  it('returns true when scopes are required but the provider is undefined', () => {
    expect(isMissingScopes(undefined, ['a'])).toBe(true);
  });

  it('returns the falsy required scopes value itself when it is undefined', () => {
    expect(
      isMissingScopes(provider(), undefined as unknown as string[])
    ).toBeUndefined();
  });

  it('compares scopes case-sensitively', () => {
    expect(isMissingScopes(provider({ scopes: ['Email'] }), ['email'])).toBe(
      true
    );
  });

  it('returns false when a mixed-case required scope is granted exactly', () => {
    expect(isMissingScopes(provider({ scopes: ['Email'] }), ['Email'])).toBe(
      false
    );
  });
});

describe('isProviderType', () => {
  it.each(ALL_IDENTITY_PROVIDERS)('returns true for %s', (value) => {
    expect(isProviderType(value)).toBe(true);
  });

  it.each([['twitter'], ['X'], [undefined], [{}]])(
    'returns false for %j',
    (value) => {
      expect(isProviderType(value)).toBe(false);
    }
  );
});

describe('isIdentityProvider', () => {
  it('returns true for an identity provider', () => {
    expect(isIdentityProvider('DISCORD')).toBe(true);
  });

  it('returns false for an auth provider string', () => {
    expect(isIdentityProvider('discord')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isIdentityProvider(null)).toBe(false);
  });
});

describe('providerSchema', () => {
  it('defaults the status to ACTIVE', () => {
    expect(
      providerSchema.parse({
        type: 'DISCORD',
        scopes: ['identify'],
        label: 'x'
      })
    ).toEqual({
      type: 'DISCORD',
      scopes: ['identify'],
      label: 'x',
      status: 'ACTIVE'
    });
  });

  it('keeps an ERROR status', () => {
    expect(
      providerSchema.parse({
        type: 'DISCORD',
        scopes: [],
        label: 'x',
        status: 'ERROR'
      }).status
    ).toBe('ERROR');
  });

  it.each([[null], [undefined], ['https://x.com/dog']])(
    'accepts a link of %j',
    (link) => {
      expect(
        providerSchema.safeParse({
          type: 'TWITTER',
          scopes: [],
          label: 'x',
          link
        }).success
      ).toBe(true);
    }
  );

  it.each([
    ['an unknown type', { type: 'GITHUB' }, ['type']],
    ['missing scopes', { scopes: undefined }, ['scopes']],
    ['non-string scopes', { scopes: [1] }, ['scopes', 0]],
    ['a missing label', { label: undefined }, ['label']],
    ['a PENDING status', { status: 'PENDING' }, ['status']],
    ['a numeric link', { link: 1 }, ['link']]
  ])('rejects %s', (_case, overrides, path) => {
    const result = providerSchema.safeParse({
      type: 'TWITTER',
      scopes: [],
      label: 'x',
      ...overrides
    });

    expect(result.error?.issues[0].path).toEqual(path);
  });
});

describe('IDENTITY_PROVIDER_LABEL', () => {
  it('labels every identity provider', () => {
    expect(IDENTITY_PROVIDER_LABEL).toEqual({
      TWITTER: 'X (Twitter)',
      BLUESKY: 'Bluesky',
      ANONYMOUS: 'Anonymous',
      GOOGLE: 'Google',
      DISCORD: 'Discord',
      YOUTUBE: 'YouTube',
      EMAIL: 'Email',
      TWITCH: 'Twitch',
      STEAM: 'Steam',
      KICK: 'Kick',
      INSTAGRAM: 'Instagram',
      FACEBOOK: 'Facebook',
      TIKTOK: 'TikTok',
      VELORA: 'Velora',
      LINKEDIN: 'LinkedIn'
    });
  });
});

describe('IS_SOCIAL_PROVIDER', () => {
  it('has an entry for every identity provider', () => {
    expect(Object.keys(IS_SOCIAL_PROVIDER).sort()).toEqual(
      [...ALL_IDENTITY_PROVIDERS].sort()
    );
  });

  it.each(['ANONYMOUS', 'YOUTUBE', 'EMAIL'] as const)(
    'does not treat %s as social',
    (key) => {
      expect(IS_SOCIAL_PROVIDER[key]).toBe(false);
    }
  );
});

describe('SOCIAL_PROVIDERS', () => {
  it('lists the social providers in declaration order', () => {
    expect(SOCIAL_PROVIDERS).toEqual([
      'TWITTER',
      'BLUESKY',
      'GOOGLE',
      'DISCORD',
      'STEAM',
      'TWITCH',
      'KICK',
      'TIKTOK',
      'FACEBOOK',
      'INSTAGRAM',
      'VELORA',
      'LINKEDIN'
    ]);
  });
});

describe('ENABLED_IDENTITY_PROVIDERS', () => {
  it('enables every identity provider except YouTube', () => {
    const disabled = Object.entries(ENABLED_IDENTITY_PROVIDERS)
      .filter(([, enabled]) => !enabled)
      .map(([key]) => key);

    expect(disabled).toEqual(['YOUTUBE']);
    expect(Object.keys(ENABLED_IDENTITY_PROVIDERS).sort()).toEqual(
      [...ALL_IDENTITY_PROVIDERS].sort()
    );
  });
});

describe('LOGIN_PROVIDERS', () => {
  it('lists the providers available for login in declaration order', () => {
    expect(LOGIN_PROVIDERS).toEqual([
      'TWITTER',
      'GOOGLE',
      'BLUESKY',
      'DISCORD',
      'STEAM',
      'TWITCH',
      'KICK',
      'TIKTOK',
      'VELORA',
      'LINKEDIN',
      'EMAIL'
    ]);
  });

  it.each(['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'ANONYMOUS'] as const)(
    'excludes %s',
    (key) => {
      expect(LOGIN_PROVIDERS).not.toContain(key);
    }
  );
});

describe('authProviderSchema', () => {
  it('accepts every lower-case auth provider', () => {
    expect(authProviderSchema.options.map((option) => option.value)).toEqual([
      'twitter',
      'bluesky',
      'google',
      'discord',
      'steam',
      'twitch',
      'kick',
      'tiktok',
      'facebook',
      'instagram',
      'youtube',
      'email',
      'velora',
      'linkedin',
      'anonymous'
    ]);
  });

  it('rejects an upper-case identity provider', () => {
    expect(authProviderSchema.safeParse('TWITTER').success).toBe(false);
  });
});

describe('parseAuthProvider', () => {
  it('returns a valid auth provider', () => {
    expect(parseAuthProvider('google')).toBe('google');
  });

  it('throws a VALIDATION_ERROR naming the invalid value', () => {
    const error = catchError(() => parseAuthProvider('github'));

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid auth provider: github'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('rejects an upper-case identity provider', () => {
    expect(() => parseAuthProvider('TWITTER')).toThrow(
      'Invalid auth provider: TWITTER'
    );
  });

  it('stringifies non-string values in the error message', () => {
    expect(() => parseAuthProvider(undefined)).toThrow(
      'Invalid auth provider: undefined'
    );
  });

  it('stringifies objects as [object Object] in the error message', () => {
    expect(() => parseAuthProvider({ provider: 'google' })).toThrow(
      'Invalid auth provider: [object Object]'
    );
  });
});

describe('IDENTITY_PROVIDER_TO_AUTH_PROVIDER', () => {
  it.each(ALL_IDENTITY_PROVIDERS)(
    'maps %s to its lower-case auth provider',
    (key) => {
      expect(IDENTITY_PROVIDER_TO_AUTH_PROVIDER[key]).toBe(key.toLowerCase());
    }
  );

  it('only maps to valid auth providers', () => {
    for (const value of Object.values(IDENTITY_PROVIDER_TO_AUTH_PROVIDER)) {
      expect(authProviderSchema.safeParse(value).success).toBe(true);
    }
  });
});

describe('AUTH_PROVIDER_TO_IDENTITY_PROVIDER', () => {
  it('inverts the identity to auth provider mapping', () => {
    expect(AUTH_PROVIDER_TO_IDENTITY_PROVIDER).toEqual(
      Object.fromEntries(
        ALL_IDENTITY_PROVIDERS.map((key) => [key.toLowerCase(), key])
      )
    );
  });

  it('returns undefined for an unknown auth provider', () => {
    expect(AUTH_PROVIDER_TO_IDENTITY_PROVIDER.github).toBeUndefined();
  });
});

describe('doesUserHaveAllowedIdentity', () => {
  describe('when the user is missing', () => {
    it('returns false for null', () => {
      expect(doesUserHaveAllowedIdentity(null, ['ANONYMOUS'])).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(doesUserHaveAllowedIdentity(undefined, ['TWITTER'])).toBe(false);
    });

    it('returns false when the user has no providers list', () => {
      expect(
        doesUserHaveAllowedIdentity(
          {} as unknown as { providers: ProviderSchema[] },
          ['ANONYMOUS']
        )
      ).toBe(false);
    });
  });

  describe('when anonymous entries are allowed', () => {
    it('returns true for a user without any linked providers', () => {
      expect(
        doesUserHaveAllowedIdentity({ providers: [] }, ['ANONYMOUS'])
      ).toBe(true);
    });

    it('returns true even when the user has none of the other allowed providers', () => {
      expect(
        doesUserHaveAllowedIdentity(
          { providers: [provider({ type: 'STEAM' })] },
          ['TWITTER', 'ANONYMOUS']
        )
      ).toBe(true);
    });
  });

  describe('when anonymous entries are not allowed', () => {
    it('returns true when one of the user providers is allowed', () => {
      expect(
        doesUserHaveAllowedIdentity(
          {
            providers: [
              provider({ type: 'STEAM' }),
              provider({ type: 'DISCORD' })
            ]
          },
          ['TWITTER', 'DISCORD']
        )
      ).toBe(true);
    });

    it('returns false when none of the user providers are allowed', () => {
      expect(
        doesUserHaveAllowedIdentity(
          { providers: [provider({ type: 'STEAM' })] },
          ['TWITTER', 'DISCORD']
        )
      ).toBe(false);
    });

    it('returns false when the user has no providers', () => {
      expect(doesUserHaveAllowedIdentity({ providers: [] }, ['TWITTER'])).toBe(
        false
      );
    });

    it('returns false when no identities are allowed', () => {
      expect(doesUserHaveAllowedIdentity({ providers: [provider()] }, [])).toBe(
        false
      );
    });

    it('accepts a provider whose status is ERROR', () => {
      expect(
        doesUserHaveAllowedIdentity(
          { providers: [provider({ type: 'TWITTER', status: 'ERROR' })] },
          ['TWITTER']
        )
      ).toBe(true);
    });
  });
});
