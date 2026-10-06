import { describe, it, expect, vi, afterEach } from 'vitest';
import { IntegrationProvider, IntegrationStatus } from '@giveaway/db-model';
import {
  DEFAULT_INTEGRATION_LABEL,
  integrationSchema,
  integrationsSchema,
  twitterStateSchema,
  hasScope,
  hasFeature,
  type IntegrationSchema
} from '../schemas';
import type {
  BlueskyFeatureSchema,
  TwitchFeatureSchema,
  TwitterFeatureSchema
} from '../scopes';

const base = {
  id: 'int-1',
  label: '@giveawaydog',
  url: null,
  account_id: null,
  status: IntegrationStatus.ACTIVE
};

const twitter = (scopes?: string[]) => ({
  ...base,
  provider: IntegrationProvider.TWITTER,
  scopes
});

const bluesky = (scopes?: string[]) => ({
  ...base,
  provider: IntegrationProvider.BLUESKY,
  scopes
});

const twitch = (scopes?: string[]) => ({
  ...base,
  provider: IntegrationProvider.TWITCH,
  scopes
});

const PROFILE_SCOPES = ['tweet.read', 'users.read', 'offline.access'];

const subscription = () => ({
  id: 'sub-1',
  twitch_id: 'twitch-sub-1',
  integrationId: 'int-1',
  type: 'channel.chat.message',
  version: '1',
  status: 'enabled',
  broadcaster_user_id: 'broadcaster-1',
  cost: 0,
  callback: 'https://giveaway.dog/api/twitch/eventsub',
  method: 'webhook',
  created_at: '2026-01-01T00:00:00.000Z',
  last_event_received_at: null
});

describe('environment derived constants', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reads the twitter team app credentials from the environment', async () => {
    vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'client-id');
    vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'client-secret');
    vi.resetModules();

    const mod = await import('../schemas');

    expect({
      id: mod.TWITTER_TEAM_APP_CLIENT_ID,
      secret: mod.TWITTER_TEAM_APP_CLIENT_SECRET
    }).toEqual({
      id: 'client-id',
      secret: 'client-secret'
    });
  });

  it('leaves the twitter team app credentials undefined when they are unset', async () => {
    vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', undefined);
    vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', undefined);
    vi.resetModules();

    const mod = await import('../schemas');

    expect({
      id: mod.TWITTER_TEAM_APP_CLIENT_ID,
      secret: mod.TWITTER_TEAM_APP_CLIENT_SECRET
    }).toEqual({
      id: undefined,
      secret: undefined
    });
  });
});

describe('DEFAULT_INTEGRATION_LABEL', () => {
  it('is the MISSING_NO placeholder', () => {
    expect(DEFAULT_INTEGRATION_LABEL).toBe('MISSING_NO');
  });
});

describe('integrationSchema', () => {
  describe('when the integration is valid', () => {
    it('accepts the minimal shape', () => {
      expect(integrationSchema.parse(twitter())).toEqual({
        ...base,
        provider: 'TWITTER'
      });
    });

    it('keeps scopes, settings and a url', () => {
      const input = {
        ...twitter(['tweet.read']),
        url: 'https://x.com/giveawaydog',
        account_id: '12345',
        settings: { anything: ['goes'] }
      };

      expect(integrationSchema.parse(input)).toEqual(input);
    });

    it.each(Object.values(IntegrationProvider))(
      'accepts the %s provider',
      (value) => {
        expect(
          integrationSchema.parse({ ...twitter(), provider: value }).provider
        ).toBe(value);
      }
    );

    it.each(Object.values(IntegrationStatus))(
      'accepts the %s status',
      (value) => {
        expect(
          integrationSchema.parse({ ...twitter(), status: value }).status
        ).toBe(value);
      }
    );

    it('coerces the state expiry into a date', () => {
      const parsed = integrationSchema.parse({
        ...twitter(),
        state: {
          id: 'state-1',
          value: { codeVerifier: 'v' },
          expiresAt: '2026-05-01T12:00:00.000Z'
        }
      });

      expect(parsed.state).toEqual({
        id: 'state-1',
        value: { codeVerifier: 'v' },
        expiresAt: new Date('2026-05-01T12:00:00.000Z')
      });
    });

    it.each([[null], [undefined]])('accepts a state of %j', (state) => {
      expect(integrationSchema.parse({ ...twitter(), state }).state).toBe(
        state
      );
    });

    it('accepts a state without an expiry', () => {
      expect(
        integrationSchema.parse({
          ...twitter(),
          state: { id: 'state-1', value: 'v' }
        }).state
      ).toEqual({ id: 'state-1', value: 'v' });
    });

    it('keeps a null state expiry as null', () => {
      expect(
        integrationSchema.parse({
          ...twitter(),
          state: { id: 'state-1', value: null, expiresAt: null }
        }).state?.expiresAt
      ).toBeNull();
    });

    it('coerces subscription timestamps into dates', () => {
      const parsed = integrationSchema.parse({
        ...twitch(),
        subscriptions: [
          {
            ...subscription(),
            last_event_received_at: '2026-02-01T00:00:00.000Z'
          }
        ]
      });

      expect(parsed.subscriptions?.[0]).toEqual({
        ...subscription(),
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        last_event_received_at: new Date('2026-02-01T00:00:00.000Z')
      });
    });

    it('keeps a null last event timestamp as null', () => {
      const parsed = integrationSchema.parse({
        ...twitch(),
        subscriptions: [subscription()]
      });

      expect(parsed.subscriptions?.[0].last_event_received_at).toBeNull();
    });
  });

  describe('when the integration is invalid', () => {
    it.each([
      ['a missing id', { id: undefined }, ['id']],
      ['a missing label', { label: undefined }, ['label']],
      ['a url that is not a url', { url: 'giveaway.dog' }, ['url']],
      ['a missing url', { url: undefined }, ['url']],
      ['a missing account id', { account_id: undefined }, ['account_id']],
      ['a GOOGLE provider', { provider: 'GOOGLE' }, ['provider']],
      ['a lower-case provider', { provider: 'twitter' }, ['provider']],
      ['an unknown status', { status: 'DISABLED' }, ['status']],
      ['a non-string scope', { scopes: [1] }, ['scopes', 0]],
      ['a state without an id', { state: { value: 1 } }, ['state', 'id']],
      [
        'a state expiry that is not a date',
        { state: { id: 's', value: 1, expiresAt: 'soon' } },
        ['state', 'expiresAt']
      ],
      [
        'a subscription with an invalid creation date',
        { subscriptions: [{ ...subscription(), created_at: 'nope' }] },
        ['subscriptions', 0, 'created_at']
      ],
      [
        'a subscription without a cost',
        { subscriptions: [{ ...subscription(), cost: undefined }] },
        ['subscriptions', 0, 'cost']
      ],
      [
        'a subscription with a missing last event timestamp',
        {
          subscriptions: [
            { ...subscription(), last_event_received_at: undefined }
          ]
        },
        ['subscriptions', 0, 'last_event_received_at']
      ]
    ])('rejects %s', (_case, overrides, path) => {
      const result = integrationSchema.safeParse({
        ...twitter(),
        ...overrides
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(path);
    });
  });
});

describe('integrationsSchema', () => {
  it('parses a list of integrations', () => {
    expect(integrationsSchema.parse([twitter(), bluesky()])).toHaveLength(2);
  });

  it('accepts an empty list', () => {
    expect(integrationsSchema.parse([])).toEqual([]);
  });

  it('reports the index of an invalid integration', () => {
    const result = integrationsSchema.safeParse([
      twitter(),
      { ...twitter(), id: 1 }
    ]);

    expect(result.error?.issues[0].path).toEqual([1, 'id']);
  });
});

describe('twitterStateSchema', () => {
  it('accepts a team id and code verifier', () => {
    expect(
      twitterStateSchema.parse({
        teamId: 'team-1',
        codeVerifier: 'verifier',
        extra: true
      })
    ).toEqual({ teamId: 'team-1', codeVerifier: 'verifier' });
  });

  it.each(['teamId', 'codeVerifier'])('requires %s', (field) => {
    const input: Record<string, unknown> = {
      teamId: 'team-1',
      codeVerifier: 'verifier'
    };
    delete input[field];

    expect(twitterStateSchema.safeParse(input).error?.issues[0].path).toEqual([
      field
    ]);
  });
});

describe('hasScope', () => {
  it('returns true when the integration has the scope', () => {
    expect(
      hasScope(twitter(['tweet.read', 'tweet.write']), 'tweet.write')
    ).toBe(true);
  });

  it('returns false when the integration lacks the scope', () => {
    expect(hasScope(twitter(['tweet.read']), 'tweet.write')).toBe(false);
  });

  it('returns false when the integration has no scopes', () => {
    expect(hasScope(twitter(), 'tweet.read')).toBe(false);
  });

  it('returns false for an empty scopes list', () => {
    expect(hasScope(twitter([]), 'tweet.read')).toBe(false);
  });

  it('returns false for a null integration', () => {
    expect(hasScope(null, 'tweet.read')).toBe(false);
  });

  it('returns false for an undefined integration', () => {
    expect(hasScope(undefined, 'tweet.read')).toBe(false);
  });

  it('matches scopes exactly rather than by prefix', () => {
    expect(hasScope(twitter(['tweet.read']), 'tweet')).toBe(false);
  });
});

describe('hasFeature', () => {
  describe('when the integration is missing or has no scopes', () => {
    it('returns false for null', () => {
      expect(hasFeature(null, 'GET_PROFILE')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasFeature(undefined, 'FULL_ACCESS')).toBe(false);
    });

    it('returns false when scopes are undefined', () => {
      expect(hasFeature(twitter(), 'GET_PROFILE')).toBe(false);
    });
  });

  describe('for twitter integrations', () => {
    it('grants GET_PROFILE when every profile scope is present', () => {
      expect(hasFeature(twitter(PROFILE_SCOPES), 'GET_PROFILE')).toBe(true);
    });

    it('denies GET_PROFILE when a profile scope is missing', () => {
      expect(
        hasFeature(twitter(['tweet.read', 'users.read']), 'GET_PROFILE')
      ).toBe(false);
    });

    it('denies GET_PROFILE for an empty scopes list', () => {
      expect(hasFeature(twitter([]), 'GET_PROFILE')).toBe(false);
    });

    it('grants POST_TWEETS when profile and posting scopes are present', () => {
      expect(
        hasFeature(
          twitter([...PROFILE_SCOPES, 'tweet.write', 'media.write']),
          'POST_TWEETS'
        )
      ).toBe(true);
    });

    it('denies POST_TWEETS when only the posting scopes are present', () => {
      expect(
        hasFeature(twitter(['tweet.write', 'media.write']), 'POST_TWEETS')
      ).toBe(false);
    });

    it('denies IMPORT_TASKS when a feature scope is missing', () => {
      expect(
        hasFeature(twitter([...PROFILE_SCOPES, 'follows.read']), 'IMPORT_TASKS')
      ).toBe(false);
    });

    it('grants IMPORT_TASKS when profile and import scopes are present', () => {
      expect(
        hasFeature(
          twitter([...PROFILE_SCOPES, 'follows.read', 'like.read']),
          'IMPORT_TASKS'
        )
      ).toBe(true);
    });

    it('throws a TypeError for a feature that has no twitter scope group', () => {
      expect(() =>
        hasFeature(
          twitter(PROFILE_SCOPES),
          'FULL_ACCESS' as unknown as TwitterFeatureSchema
        )
      ).toThrow(TypeError);
    });
  });

  describe('for bluesky integrations', () => {
    it('grants FULL_ACCESS when both atproto scopes are present', () => {
      expect(
        hasFeature(bluesky(['atproto', 'transition:generic']), 'FULL_ACCESS')
      ).toBe(true);
    });

    it('denies FULL_ACCESS when a scope is missing', () => {
      expect(hasFeature(bluesky(['atproto']), 'FULL_ACCESS')).toBe(false);
    });

    it('returns false for a feature that has no bluesky scope group', () => {
      expect(
        hasFeature(
          bluesky(['atproto', 'transition:generic']),
          'GET_PROFILE' as unknown as BlueskyFeatureSchema
        )
      ).toBe(false);
    });
  });

  describe('for twitch integrations', () => {
    it('grants USER_PROFILE when the email scope is present', () => {
      expect(hasFeature(twitch(['user:read:email']), 'USER_PROFILE')).toBe(
        true
      );
    });

    it('denies MODERATION_READ when the moderation scope is missing', () => {
      expect(hasFeature(twitch(['user:read:email']), 'MODERATION_READ')).toBe(
        false
      );
    });

    it('grants CHANNEL_REDEMPTIONS when the redemptions scope is present', () => {
      expect(
        hasFeature(twitch(['channel:read:redemptions']), 'CHANNEL_REDEMPTIONS')
      ).toBe(true);
    });

    it('grants CHAT_COMMANDS for any scopes list because it requires no scopes', () => {
      expect(hasFeature(twitch([]), 'CHAT_COMMANDS')).toBe(true);
    });

    it('returns false for a feature that has no twitch scope group', () => {
      expect(
        hasFeature(
          twitch(['user:read:email']),
          'GET_PROFILE' as unknown as TwitchFeatureSchema
        )
      ).toBe(false);
    });
  });

  describe('for other providers', () => {
    it('returns false for a discord integration', () => {
      const discord: IntegrationSchema = {
        ...base,
        provider: IntegrationProvider.DISCORD,
        scopes: ['identify', 'user:read:email']
      };

      expect(
        hasFeature(
          discord as unknown as Parameters<typeof hasFeature>[0],
          'USER_PROFILE'
        )
      ).toBe(false);
    });
  });
});
