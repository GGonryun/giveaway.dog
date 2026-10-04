import 'server-only';

import { redis } from '@giveaway/cache/redis';
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from './scopes';

const BOT_TOKEN_CACHE_KEY = 'twitch:bot:access_token';

type BotTokenResponse = {
  access_token: string;
  expires_in: number;
};

const refreshBotToken = async (): Promise<string | null> => {
  const refreshToken = process.env.TWITCH_BOT_REFRESH_TOKEN;
  if (!refreshToken) return null;

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    console.error(`[Twitch] Failed to refresh bot token: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as BotTokenResponse;
  await redis.set(BOT_TOKEN_CACHE_KEY, data.access_token, {
    ex: data.expires_in - 60
  });
  return data.access_token;
};

export const getBotAccessToken = async (): Promise<string | null> => {
  const cached = await redis.get<string>(BOT_TOKEN_CACHE_KEY);
  if (cached) return cached;
  return refreshBotToken();
};

export const invalidateAndRefreshBotToken = async (): Promise<
  string | null
> => {
  await redis.del(BOT_TOKEN_CACHE_KEY);
  return refreshBotToken();
};
