import { describe, it, expect, vi, afterEach } from 'vitest';

const ENV_KEYS = [
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_EVENTSUB_SECRET',
  'TWITCH_BOT_USER_ID',
  'NEXT_PUBLIC_APP_URL'
] as const;

type ScopesEnv = Partial<Record<(typeof ENV_KEYS)[number], string>>;

const loadScopes = async (env: ScopesEnv) => {
  vi.resetModules();
  for (const key of ENV_KEYS) {
    vi.stubEnv(key, env[key]);
  }
  return import('../scopes');
};

describe('twitch scopes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('static scope lists', () => {
    it('requests openid, email, moderation and redemption scopes for the integration', async () => {
      const scopes = await loadScopes({});

      expect(scopes.TWITCH_INTEGRATION_SCOPES).toEqual([
        'openid',
        'user:read:email',
        'moderation:read',
        'channel:read:redemptions'
      ]);
    });

    it('requests only moderation:read for moderators', async () => {
      const scopes = await loadScopes({});

      expect(scopes.TWITCH_MODERATOR_SCOPES).toEqual(['moderation:read']);
    });

    it('requests chat and bot scopes for the bot account', async () => {
      const scopes = await loadScopes({});

      expect(scopes.TWITCH_BOT_SCOPES).toEqual([
        'user:read:chat',
        'user:bot',
        'channel:bot',
        'chat:edit'
      ]);
    });
  });

  describe('when the environment is configured', () => {
    const env: ScopesEnv = {
      TWITCH_CLIENT_ID: 'client-id',
      TWITCH_CLIENT_SECRET: 'client-secret',
      TWITCH_EVENTSUB_SECRET: 'eventsub-secret',
      TWITCH_BOT_USER_ID: 'bot-1',
      NEXT_PUBLIC_APP_URL: 'https://giveaway.test'
    };

    it('exposes the client id from the environment', async () => {
      const scopes = await loadScopes(env);

      expect(scopes.TWITCH_CLIENT_ID).toBe('client-id');
    });

    it('exposes the client secret from the environment', async () => {
      const scopes = await loadScopes(env);

      expect(scopes.TWITCH_CLIENT_SECRET).toBe('client-secret');
    });

    it('exposes the eventsub secret from the environment', async () => {
      const scopes = await loadScopes(env);

      expect(scopes.TWITCH_EVENTSUB_SECRET).toBe('eventsub-secret');
    });

    it('exposes the bot user id from the environment', async () => {
      const scopes = await loadScopes(env);

      expect(scopes.TWITCH_BOT_USER_ID).toBe('bot-1');
    });

    it('builds the redirect uri from the public app url', async () => {
      const scopes = await loadScopes(env);

      expect(scopes.TWITCH_REDIRECT_URI).toBe(
        'https://giveaway.test/api/twitch/callback'
      );
    });

    it('captures the environment at import time', async () => {
      const scopes = await loadScopes(env);

      vi.stubEnv('TWITCH_CLIENT_ID', 'changed-client-id');

      expect(scopes.TWITCH_CLIENT_ID).toBe('client-id');
    });
  });

  describe('when the environment is not configured', () => {
    it('leaves the credentials undefined', async () => {
      const scopes = await loadScopes({});

      expect({
        clientId: scopes.TWITCH_CLIENT_ID,
        clientSecret: scopes.TWITCH_CLIENT_SECRET,
        eventSubSecret: scopes.TWITCH_EVENTSUB_SECRET,
        botUserId: scopes.TWITCH_BOT_USER_ID
      }).toEqual({
        clientId: undefined,
        clientSecret: undefined,
        eventSubSecret: undefined,
        botUserId: undefined
      });
    });

    it('builds a redirect uri prefixed with the string undefined', async () => {
      const scopes = await loadScopes({});

      expect(scopes.TWITCH_REDIRECT_URI).toBe('undefined/api/twitch/callback');
    });
  });
});
