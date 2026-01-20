import {
  DiscordApplicationCommandInteractionSchema,
  DiscordButtonInteractionSchema,
  DiscordInteractionSchema
} from '../schema';
import { handleConnectCommand } from './connect';
import { processTaskEntry } from './task';

export const scheduleDiscordJob = async (payload: DiscordInteractionSchema) => {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const url = `${base}/api/discord/jobs`;
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
  });
};

export const handleDiscordJob = async (
  interaction: DiscordInteractionSchema
) => {
  if (interaction.type === 2) {
    const command: DiscordApplicationCommandInteractionSchema = interaction;
    switch (command.data.name) {
      case 'connect':
        return handleConnectCommand(command);
      default:
        return {
          content: `Unknown command: ${command.data.name}`
        };
    }
  } else if (interaction.type === 3) {
    const buttonInteraction: DiscordButtonInteractionSchema = interaction;
    const customId = buttonInteraction.data.custom_id;
    const [action, operation, taskId] = customId.split(':');

    if (action === 'task' && operation === 'enter' && taskId) {
      return await processTaskEntry({ body: buttonInteraction, taskId });
    }

    return {
      content: 'Unknown button interaction.'
    };
  }

  return {
    content: 'Unknown interaction type.'
  };
};
