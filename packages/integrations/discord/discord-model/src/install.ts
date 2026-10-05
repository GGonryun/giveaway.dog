import { ApplicationError } from '@giveaway/util-errors';

export const DISCORD_BOT_SCOPES = ['bot', 'applications.commands'];
const DISCORD_BOT_PERMISSIONS = '18432';
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';

export const getDiscordInstallUrl = () => {
  const DISCORD_BOT_ID = process.env.NEXT_PUBLIC_DISCORD_BOT_ID;

  if (!DISCORD_BOT_ID) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Discord Bot not configured'
    });
  }

  const params = new URLSearchParams({
    client_id: DISCORD_BOT_ID,
    permissions: DISCORD_BOT_PERMISSIONS,
    scope: DISCORD_BOT_SCOPES.join(' ')
  });

  return `${DISCORD_AUTH_URL}?${params.toString()}`;
};
