import 'server-only';

import { NextResponse } from 'next/server';
import db from '@giveaway/db-client/prisma';
import { twitchRevocationSchema } from '@giveaway/twitch-model/schema';

export const handleRevocation = async (body: unknown) => {
  const data = twitchRevocationSchema.parse(body);
  const { subscription } = data;

  const eventSubSubscription = await db.eventSubSubscription.findUnique({
    where: {
      twitch_id: subscription.id
    },
    include: {
      integration: true
    }
  });

  if (eventSubSubscription) {
    await db.eventSubSubscription.delete({
      where: { id: eventSubSubscription.id }
    });

    const remainingSubscriptions = await db.eventSubSubscription.count({
      where: {
        integrationId: eventSubSubscription.integrationId
      }
    });

    if (remainingSubscriptions === 0) {
      await db.integration.update({
        where: { id: eventSubSubscription.integrationId },
        data: {
          status: 'ERROR'
        }
      });
    }

    console.log(
      `[Twitch] Subscription ${subscription.id} (${subscription.type}) revoked`
    );
  }

  return NextResponse.json({ status: 'ok' });
};
