import { ApplicationError } from '@giveaway/util-errors';
import { TWITCH_CLIENT_ID } from '../bot/scopes';
import { getAppAccessToken } from './get-app-access-token';
import prisma from '@giveaway/db-client/prisma';
import { EventSubSubscription } from '@prisma/client';

export const deleteEventSubSubscription = async ({
  subscriptionId,
  twitchId,
  accessToken
}: {
  subscriptionId: string;
  twitchId: string;
  accessToken: string;
}): Promise<void> => {
  if (!TWITCH_CLIENT_ID) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Twitch client ID not configured'
    });
  }

  const response = await fetch(
    `https://api.twitch.tv/helix/eventsub/subscriptions?id=${twitchId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const errorData = await response.text();
    console.error('EventSub subscription deletion failed:', errorData);
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete EventSub subscription'
    });
  }

  await prisma.eventSubSubscription.delete({
    where: { id: subscriptionId }
  });
};

export const deleteAllEventSubSubscriptions = async (
  subscriptions: EventSubSubscription[]
): Promise<void> => {
  if (subscriptions.length === 0) return;

  const accessToken = await getAppAccessToken();

  await Promise.all(
    subscriptions.map((sub) =>
      deleteEventSubSubscription({
        subscriptionId: sub.id,
        twitchId: sub.twitch_id,
        accessToken
      })
    )
  );
};
