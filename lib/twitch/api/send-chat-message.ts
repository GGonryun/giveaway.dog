import { TWITCH_BOT_USER_ID, TWITCH_CLIENT_ID } from '../bot/scopes';
import {
  getBotAccessToken,
  invalidateAndRefreshBotToken
} from '../bot/bot-token';

const callSendMessage = async (
  token: string,
  broadcasterId: string,
  message: string
): Promise<Response> => {
  return fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': TWITCH_CLIENT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      broadcaster_id: broadcasterId,
      sender_id: TWITCH_BOT_USER_ID,
      message
    })
  });
};

export const sendChatMessage = async (
  broadcasterId: string,
  message: string
): Promise<void> => {
  let token = await getBotAccessToken();
  if (!token) {
    console.info('[Twitch] No bot token configured, skipping chat reply');
    return;
  }

  let response = await callSendMessage(token, broadcasterId, message);

  if (response.status === 401) {
    token = await invalidateAndRefreshBotToken();
    if (!token) {
      console.info('[Twitch] Bot token refresh failed, skipping chat reply');
      return;
    }
    response = await callSendMessage(token, broadcasterId, message);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `[Twitch] Failed to send chat message: ${response.status}`,
      body
    );
  }
};
