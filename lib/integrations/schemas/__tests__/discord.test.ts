import { describe, it, expect } from 'vitest';
import { discordIntegrationSettingsSchema } from '../discord';

describe('discordIntegrationSettingsSchema', () => {
  describe('when settings are valid', () => {
    it('defaults notifyOnNewGiveaway to true for an empty object', () => {
      expect(discordIntegrationSettingsSchema.parse({})).toEqual({
        notifyOnNewGiveaway: true
      });
    });

    it('keeps every provided field', () => {
      const settings = {
        registrationKey: 'reg-key',
        registrationKeyExpiry: '2026-01-01T00:00:00.000Z',
        guildName: 'Dog Park',
        guildIcon: 'https://cdn.discordapp.com/icons/1/abc.png',
        channelId: '1234567890',
        channelName: 'giveaways',
        notifyOnNewGiveaway: false
      };

      expect(discordIntegrationSettingsSchema.parse(settings)).toEqual(
        settings
      );
    });

    it('accepts a null guild icon', () => {
      expect(
        discordIntegrationSettingsSchema.parse({ guildIcon: null })
      ).toEqual({ guildIcon: null, notifyOnNewGiveaway: true });
    });

    it('keeps the registration key expiry as a string without coercion', () => {
      const parsed = discordIntegrationSettingsSchema.parse({
        registrationKeyExpiry: 'tomorrow'
      });

      expect(parsed.registrationKeyExpiry).toBe('tomorrow');
    });

    it('strips unknown keys', () => {
      expect(
        discordIntegrationSettingsSchema.parse({ webhookUrl: 'https://x.y' })
      ).toEqual({ notifyOnNewGiveaway: true });
    });
  });

  describe('when settings are invalid', () => {
    it('rejects a guild icon that is not a url', () => {
      const result = discordIntegrationSettingsSchema.safeParse({
        guildIcon: 'abc.png'
      });

      expect(result.error?.issues).toEqual([
        expect.objectContaining({
          path: ['guildIcon'],
          message: 'Invalid url'
        })
      ]);
    });

    it('rejects a non-boolean notifyOnNewGiveaway', () => {
      const result = discordIntegrationSettingsSchema.safeParse({
        notifyOnNewGiveaway: 'true'
      });

      expect(result.error?.issues[0].path).toEqual(['notifyOnNewGiveaway']);
    });

    it.each([
      'registrationKey',
      'registrationKeyExpiry',
      'guildName',
      'channelId',
      'channelName'
    ])('rejects a non-string %s', (field) => {
      const result = discordIntegrationSettingsSchema.safeParse({
        [field]: 123
      });

      expect(result.error?.issues[0].path).toEqual([field]);
    });

    it('rejects a null channel id', () => {
      expect(
        discordIntegrationSettingsSchema.safeParse({ channelId: null }).success
      ).toBe(false);
    });

    it.each([[null], [undefined], ['settings']])('rejects %j', (value) => {
      expect(discordIntegrationSettingsSchema.safeParse(value).success).toBe(
        false
      );
    });
  });
});
