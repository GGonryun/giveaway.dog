import { DiscordApplicationCommandInteractionSchema } from '../schema';
import { handleConnectCommand } from './connect';

export const scheduleDiscordJob = async (
  payload: DiscordApplicationCommandInteractionSchema
) => {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const url = `${base}/api/discord/jobs`;
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
  });
};

export const handleDiscordJob = async (
  command: DiscordApplicationCommandInteractionSchema
) => {
  switch (command.data.name) {
    case 'connect':
      return handleConnectCommand(command);
    default:
      return {
        content: `Unknown command: ${command.data.name}`
      };
  }
};
