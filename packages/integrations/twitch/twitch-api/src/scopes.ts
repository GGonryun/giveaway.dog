import 'server-only';

export const TWITCH_INTEGRATION_SCOPES = [
  'openid',
  'user:read:email',
  'moderation:read',
  'channel:read:redemptions'
];
export const TWITCH_MODERATOR_SCOPES = ['moderation:read'];
export const TWITCH_BOT_SCOPES = [
  'user:read:chat',
  'user:bot',
  'channel:bot',
  'chat:edit'
];
export const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
export const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
export const TWITCH_EVENTSUB_SECRET = process.env.TWITCH_EVENTSUB_SECRET!;
export const TWITCH_BOT_USER_ID = process.env.TWITCH_BOT_USER_ID!;
export const TWITCH_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/callback`;
