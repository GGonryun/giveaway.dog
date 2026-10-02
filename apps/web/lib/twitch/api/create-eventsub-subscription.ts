import { ApplicationError } from '@giveaway/util-errors';
import {
  TWITCH_CLIENT_ID,
  TWITCH_BOT_USER_ID,
  TWITCH_EVENTSUB_SECRET
} from '../bot/scopes';
import { getAppAccessToken } from './get-app-access-token';
import { toEventSubSubscriptionSchemasListSchema } from './schemas';
import {
  TwitchFeatureSchema,
  getEventSubTypesForTwitchFeatures
} from '@/lib/integrations/scopes';
import prisma from '@/lib/prisma';
import { EventSubSubscription } from '@prisma/client';

export const createEventSubSubscriptionsForFeatures = async ({
  integrationId,
  broadcasterId,
  features
}: {
  integrationId: string;
  broadcasterId: string;
  features: TwitchFeatureSchema[];
}): Promise<EventSubSubscription[]> => {
  const accessToken = await getAppAccessToken();
  const eventSubTypes = getEventSubTypesForTwitchFeatures(features);
  const results: EventSubSubscription[] = [];

  for (const eventType of eventSubTypes) {
    const result = await getOrCreateSubscription({
      integrationId,
      broadcasterId,
      type: eventType.type,
      version: eventType.version,
      accessToken
    });
    results.push(result);
  }

  return results;
};

const getOrCreateSubscription = async ({
  integrationId,
  broadcasterId,
  type,
  version,
  accessToken
}: {
  integrationId: string;
  broadcasterId: string;
  type: string;
  version: string;
  accessToken: string;
}): Promise<EventSubSubscription> => {
  const existingDb = await prisma.eventSubSubscription.findFirst({
    where: {
      integrationId,
      type,
      broadcaster_user_id: broadcasterId
    }
  });

  if (existingDb) {
    console.log(`Existing EventSub subscription found in DB for ${type}`);
    return existingDb;
  }

  const existing = await findExistingSubscription({
    broadcasterId,
    type,
    accessToken
  });

  if (existing) {
    console.log(
      `Existing EventSub subscription found on Twitch for ${type}:`,
      existing
    );

    return await prisma.eventSubSubscription.create({
      data: {
        twitch_id: existing.id,
        integrationId,
        type: existing.type,
        version: existing.version,
        status: existing.status,
        broadcaster_user_id: existing.condition.broadcaster_user_id,
        cost: existing.cost,
        callback: existing.transport.callback || '',
        method: existing.transport.method || '',
        created_at: new Date(existing.created_at)
      }
    });
  }

  const subscription = await createSubscription({
    broadcasterId,
    type,
    version,
    accessToken
  });

  console.log(`Created new EventSub subscription for ${type}:`, subscription);

  return await prisma.eventSubSubscription.create({
    data: {
      twitch_id: subscription.id,
      integrationId,
      type: subscription.type,
      version: subscription.version,
      status: subscription.status,
      broadcaster_user_id: subscription.condition.broadcaster_user_id,
      cost: subscription.cost,
      callback: subscription.transport.callback || '',
      method: subscription.transport.method || '',
      created_at: new Date(subscription.created_at)
    }
  });
};

const createSubscription = async ({
  broadcasterId,
  type,
  version,
  accessToken
}: {
  broadcasterId: string;
  type: string;
  version: string;
  accessToken: string;
}) => {
  const condition: Record<string, string> = {
    broadcaster_user_id: broadcasterId,
    user_id: TWITCH_BOT_USER_ID
  };

  const response = await fetch(
    'https://api.twitch.tv/helix/eventsub/subscriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        version,
        condition,
        transport: {
          method: 'webhook',
          callback: `${process.env.TWITCH_EVENTSUB_URL ?? process.env.NEXT_PUBLIC_APP_URL}/api/twitch/webhooks`,
          secret: TWITCH_EVENTSUB_SECRET
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error(
      `EventSub subscription creation failed for ${type}:`,
      errorData
    );
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create EventSub subscription for ${type}`,
      data: errorData
    });
  }

  const list = toEventSubSubscriptionSchemasListSchema(await response.json());
  return list.data[0];
};

const findExistingSubscription = async ({
  broadcasterId,
  type,
  accessToken
}: {
  broadcasterId: string;
  type: string;
  accessToken: string;
}) => {
  const response = await fetch(
    'https://api.twitch.tv/helix/eventsub/subscriptions',
    {
      headers: {
        'Client-Id': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const list = toEventSubSubscriptionSchemasListSchema(await response.json());
  const existing = list.data;

  const subscription = existing.find((sub) => {
    if (sub.type !== type) return false;
    if (sub.condition.broadcaster_user_id !== broadcasterId) return false;
    if (sub.condition.user_id !== TWITCH_BOT_USER_ID) return false;
    return true;
  });

  return subscription;
};
