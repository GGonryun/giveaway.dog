import z from 'zod';
import {
  discordApplicationCommandInteractionSchema,
  DiscordApplicationCommandInteractionSchema
} from '../bot/schema';
import { ApplicationError } from '@giveaway/util-errors';

export const discordIntegrationSettings =
  discordApplicationCommandInteractionSchema.pick({
    member: true,
    channel: true,
    guild: true
  });

export type DiscordIntegrationSettings = z.infer<
  typeof discordIntegrationSettings
>;

export const toDiscordIntegrationSettings = (
  obj: DiscordApplicationCommandInteractionSchema
): DiscordIntegrationSettings => {
  const result = discordIntegrationSettings.safeParse({
    member: obj.member,
    channel: obj.channel,
    guild: obj.guild
  });

  if (!result.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord integration settings',
      cause: result.error
    });
  }

  return result.data;
};
