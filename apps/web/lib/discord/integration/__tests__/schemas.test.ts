import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@/lib/errors';
import {
  discordIntegrationSettings,
  toDiscordIntegrationSettings
} from '../schemas';
import {
  applicationCommandInteraction,
  discordChannel,
  discordGuild,
  discordMember
} from '../../__tests__/fixtures-discord-core';
import type { DiscordApplicationCommandInteractionSchema } from '../../bot/schema';

const captureError = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('discordIntegrationSettings', () => {
  it('only keeps the member, channel and guild keys', () => {
    expect(Object.keys(discordIntegrationSettings.shape).sort()).toEqual([
      'channel',
      'guild',
      'member'
    ]);
  });

  it('accepts an empty object because every key is optional', () => {
    expect(discordIntegrationSettings.parse({})).toEqual({});
  });

  it('rejects an invalid guild', () => {
    expect(
      discordIntegrationSettings.safeParse({ guild: { id: 'guild-1' } }).success
    ).toBe(false);
  });
});

describe('toDiscordIntegrationSettings', () => {
  describe('when the interaction is valid', () => {
    it('returns the member, channel and guild', () => {
      const result = toDiscordIntegrationSettings(
        applicationCommandInteraction()
      );

      expect(result).toEqual({
        member: discordMember(),
        channel: discordChannel(),
        guild: discordGuild()
      });
    });

    it('drops every other interaction field', () => {
      const result = toDiscordIntegrationSettings(
        applicationCommandInteraction()
      );

      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('application_id');
      expect(result).not.toHaveProperty('data');
    });

    it('returns undefined values when the command was used outside a guild', () => {
      const result = toDiscordIntegrationSettings(
        applicationCommandInteraction({
          member: undefined,
          channel: undefined,
          guild: undefined
        })
      );

      expect(result).toEqual({});
      expect(result.member).toBeUndefined();
      expect(result.channel).toBeUndefined();
      expect(result.guild).toBeUndefined();
    });

    it('strips unknown keys from the nested objects', () => {
      const result = toDiscordIntegrationSettings({
        ...applicationCommandInteraction(),
        guild: { ...discordGuild(), name: 'Dog Park' }
      } as unknown as DiscordApplicationCommandInteractionSchema);

      expect(result.guild).toEqual(discordGuild());
    });
  });

  describe('when the interaction is invalid', () => {
    it('throws VALIDATION_ERROR with the zod error as cause', () => {
      const error = captureError(() =>
        toDiscordIntegrationSettings({
          ...applicationCommandInteraction(),
          member: { ...discordMember(), roles: 'admin' }
        } as unknown as DiscordApplicationCommandInteractionSchema)
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Discord integration settings'
      });
      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('rejects an invalid channel', () => {
      const error = captureError(() =>
        toDiscordIntegrationSettings({
          ...applicationCommandInteraction(),
          channel: { id: 'channel-1' }
        } as unknown as DiscordApplicationCommandInteractionSchema)
      );

      expect(error).toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });
});
