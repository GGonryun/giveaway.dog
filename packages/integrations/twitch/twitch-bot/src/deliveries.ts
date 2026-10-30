import 'server-only';

import { redis } from '@giveaway/cache/redis';

const DELIVERY_TTL_SECONDS = 10 * 60;

const deliveryKey = (messageId: string) => `twitch:eventsub:${messageId}`;

export const claimDelivery = async (messageId: string) =>
  (await redis.set(deliveryKey(messageId), 1, {
    nx: true,
    ex: DELIVERY_TTL_SECONDS
  })) === 'OK';

export const releaseDelivery = async (messageId: string) => {
  await redis.del(deliveryKey(messageId));
};
