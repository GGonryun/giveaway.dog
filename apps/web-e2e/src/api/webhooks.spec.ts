import { createHmac, randomUUID } from 'crypto';
import type { APIResponse } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { TWITCH_EVENTSUB_SECRET } from '../env';
import { expectNoStackTrace } from '../helpers/http';

const DISCORD_PATH = '/api/discord/interactions';

const TWITCH_PATH = '/api/twitch/webhooks';

const DISCORD_PING = JSON.stringify({ type: 1 });

const MINUTE_MS = 60 * 1000;

const expectUnauthorized = async (response: APIResponse, what: string) => {
  expect(response.status(), what).toBe(401);
  const body = await response.text();
  expectNoStackTrace(body);
  expect(JSON.parse(body)).toEqual({ error: 'Unauthorized' });
};

const twitchSubscription = (id: string) => ({
  id,
  type: 'channel.chat.message',
  version: '1',
  status: 'enabled',
  condition: { broadcaster_user_id: '1' },
  transport: { method: 'webhook', callback: 'https://example.org/' },
  created_at: new Date().toISOString()
});

const twitchHeaders = ({
  body,
  type,
  timestamp = new Date().toISOString(),
  secret = TWITCH_EVENTSUB_SECRET
}: {
  body: string;
  type: string;
  timestamp?: string;
  secret?: string;
}) => {
  const id = randomUUID();
  const hmac = createHmac('sha256', secret)
    .update(id + timestamp + body)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'Twitch-Eventsub-Message-Id': id,
    'Twitch-Eventsub-Message-Timestamp': timestamp,
    'Twitch-Eventsub-Message-Signature': `sha256=${hmac}`,
    'Twitch-Eventsub-Message-Type': type
  };
};

test.describe(
  'Discord interactions',
  { tag: ['@security', '@prod-safe'] },
  () => {
    const timestamp = () => String(Math.floor(Date.now() / 1000));

    test('refuses an interaction without a signature', async ({ request }) => {
      const response = await request.post(DISCORD_PATH, {
        headers: { 'Content-Type': 'application/json' },
        data: DISCORD_PING
      });

      await expectUnauthorized(response, 'No signature headers');
    });

    test('refuses an interaction with a forged signature', async ({
      request
    }) => {
      for (const signature of ['0'.repeat(128), 'abc']) {
        const response = await request.post(DISCORD_PATH, {
          headers: {
            'Content-Type': 'application/json',
            'X-Signature-Ed25519': signature,
            'X-Signature-Timestamp': timestamp()
          },
          data: DISCORD_PING
        });

        await expectUnauthorized(response, `The signature "${signature}"`);
      }
    });
  }
);

test.describe('Twitch EventSub webhooks', { tag: '@security' }, () => {
  test(
    'refuses a message without the EventSub headers',
    { tag: '@prod-safe' },
    async ({ request }) => {
      const response = await request.post(TWITCH_PATH, {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ subscription: twitchSubscription('e2e') })
      });

      await expectUnauthorized(response, 'No EventSub headers');
    }
  );

  test(
    'refuses a message signed with another secret',
    { tag: '@prod-safe' },
    async ({ request }) => {
      const body = JSON.stringify({ subscription: twitchSubscription('e2e') });
      const response = await request.post(TWITCH_PATH, {
        headers: twitchHeaders({
          body,
          type: 'revocation',
          secret: randomUUID()
        }),
        data: body
      });

      await expectUnauthorized(response, 'A wrong sha256= signature');
    }
  );

  test.describe('signed with the secret of the deployment', () => {
    test.skip(
      !TWITCH_EVENTSUB_SECRET,
      'Set TWITCH_EVENTSUB_SECRET to the secret of the deployment'
    );

    test('refuses a message older than 10 minutes', async ({ request }) => {
      const body = JSON.stringify({
        subscription: twitchSubscription(`e2e-${randomUUID()}`)
      });
      const response = await request.post(TWITCH_PATH, {
        headers: twitchHeaders({
          body,
          type: 'revocation',
          timestamp: new Date(Date.now() - 11 * MINUTE_MS).toISOString()
        }),
        data: body
      });

      await expectUnauthorized(response, 'A timestamp 11 minutes old');
    });

    test('echoes the challenge of a subscription verification', async ({
      request
    }) => {
      const challenge = `e2e-${randomUUID()}`;
      const body = JSON.stringify({
        challenge,
        subscription: twitchSubscription(`e2e-${randomUUID()}`)
      });
      const response = await request.post(TWITCH_PATH, {
        headers: twitchHeaders({ body, type: 'webhook_callback_verification' }),
        data: body
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/plain');
      expect(await response.text()).toBe(challenge);
    });

    test('accepts the revocation of an unknown subscription', async ({
      request
    }) => {
      const body = JSON.stringify({
        subscription: twitchSubscription(`e2e-${randomUUID()}`)
      });
      const response = await request.post(TWITCH_PATH, {
        headers: twitchHeaders({ body, type: 'revocation' }),
        data: body
      });

      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    });
  });
});
