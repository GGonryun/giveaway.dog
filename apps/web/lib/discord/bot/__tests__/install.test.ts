import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApplicationError } from '@/lib/errors';
import { DISCORD_BOT_SCOPES, getDiscordInstallUrl } from '../install';

describe('DISCORD_BOT_SCOPES', () => {
  it('requests the bot and application command scopes', () => {
    expect(DISCORD_BOT_SCOPES).toEqual(['bot', 'applications.commands']);
  });
});

describe('getDiscordInstallUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the bot id is configured', () => {
    it('builds the discord oauth authorize url', () => {
      vi.stubEnv('NEXT_PUBLIC_DISCORD_BOT_ID', 'bot-123');

      expect(getDiscordInstallUrl()).toBe(
        'https://discord.com/api/oauth2/authorize?client_id=bot-123&permissions=18432&scope=bot+applications.commands'
      );
    });

    it('url encodes the client id', () => {
      vi.stubEnv('NEXT_PUBLIC_DISCORD_BOT_ID', 'bot id&x');

      const url = new URL(getDiscordInstallUrl());

      expect(url.searchParams.get('client_id')).toBe('bot id&x');
      expect(url.searchParams.get('permissions')).toBe('18432');
      expect(url.searchParams.get('scope')).toBe('bot applications.commands');
    });
  });

  describe('when the bot id is missing', () => {
    it.each([undefined, ''])('throws INTERNAL_SERVER_ERROR for %j', (value) => {
      vi.stubEnv('NEXT_PUBLIC_DISCORD_BOT_ID', value);

      let caught: unknown;
      try {
        getDiscordInstallUrl();
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ApplicationError);
      expect(caught).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Discord Bot not configured'
      });
    });
  });
});
