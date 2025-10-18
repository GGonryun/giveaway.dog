import { PrismaClient } from '@prisma/client';
import { ApplicationError } from '../errors';
import { TaskSchema } from '@/schemas/tasks/schemas';

export const PRIVATE_STEAM_WISHLIST_ERROR = 'PRIVATE_STEAM_WISHLIST';
export const GAME_NOT_IN_WISHLIST_ERROR = 'GAME_NOT_IN_WISHLIST';

const checkSteamWishlist = async (
  steamId: string,
  appId: string
): Promise<void> => {
  const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${steamId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify Steam wishlist.',
      cause: await response.text()
    });
  }

  const wishlistData = await response.json();

  if (!wishlistData?.response?.items) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'Please ensure in your Steam profile privacy settings that you have \"My profile\" and \"Game details\" set to public',
      cause: PRIVATE_STEAM_WISHLIST_ERROR
    });
  }

  const hasAppId = wishlistData?.response?.items?.some(
    (item: any) => item.appid.toString() === appId
  );
  if (!hasAppId) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: "The specified game is not in the user's Steam wishlist.",
      cause: GAME_NOT_IN_WISHLIST_ERROR
    });
  }
};

export const validateTask = async (
  db: PrismaClient,
  input: {
    task: TaskSchema;
    userId: string;
  }
) => {
  if (input.task.type === 'STEAM_WISHLIST') {
    // Get the user's Steam account
    const steamAccount = await db.account.findFirst({
      where: {
        userId: input.userId,
        provider: 'steam'
      }
    });

    if (!steamAccount) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message:
          'You must connect your Steam account before completing this task.'
      });
    }

    // Extract the Steam App ID from the URL
    const appIdMatch = input.task.appId.match(/\/app\/(\d+)/);
    if (!appIdMatch) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Steam App URL provided.'
      });
    }

    const appId = appIdMatch[1];
    const steamId = steamAccount.providerAccountId;

    // Check if the game is in the user's wishlist
    await checkSteamWishlist(steamId, appId);
  }
};
