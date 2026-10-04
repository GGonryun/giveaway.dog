import 'server-only';

import { ApplicationError } from '@giveaway/util-errors';
import { PrismaClient } from '@giveaway/db-model';
import { SteamWishlistTaskSchema } from '@giveaway/task-model/schemas';
import {
  GAME_NOT_IN_WISHLIST_ERROR,
  PRIVATE_STEAM_WISHLIST_ERROR
} from '@giveaway/task-model/steam-errors';
import { ValidateTaskInput } from '@giveaway/task-model/types';

type OwnedGamesResponse = {
  response?: { games?: unknown[] };
};

type WishlistResponse = {
  response?: { items?: { appid: number }[] };
};

const checkSteamGameOwnership = async (
  steamId: string,
  appId: string
): Promise<boolean> => {
  console.info(
    'Checking Steam game ownership for SteamID:',
    steamId,
    'and AppID:',
    appId
  );
  const filter = JSON.stringify([parseInt(appId)]);
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_SECRET}&steamid=${steamId}&appids_filter=${encodeURIComponent(filter)}&format=json`;

  const response = await fetch(url);

  console.info('Steam API response status:', response.status);

  if (!response.ok) {
    return false;
  }

  const ownedGamesData = (await response.json()) as OwnedGamesResponse;

  console.info('Owned games data:', ownedGamesData);

  if (!ownedGamesData?.response?.games) {
    return false;
  }

  // If the game is in the response, the user owns it
  return ownedGamesData.response.games.length > 0;
};

export const checkSteamWishlist = async (
  db: PrismaClient,
  input: ValidateTaskInput<SteamWishlistTaskSchema>
): Promise<void> => {
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

  // First, check if the user already owns the game
  const ownsGame = await checkSteamGameOwnership(steamId, appId);

  if (ownsGame) {
    // User owns the game, which satisfies the requirement
    return;
  }

  // If user doesn't own the game, check wishlist
  const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${steamId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify Steam wishlist.',
      cause: await response.text()
    });
  }

  const wishlistData = (await response.json()) as WishlistResponse;

  if (!wishlistData?.response?.items) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'Please ensure in your Steam profile privacy settings that you have \"My profile\" and \"Game details\" set to public',
      cause: PRIVATE_STEAM_WISHLIST_ERROR,
      silent: true
    });
  }

  const hasAppId = wishlistData?.response?.items?.some(
    (item: any) => item.appid.toString() === appId
  );
  if (!hasAppId) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message:
        'The specified game must be in your Steam wishlist or library to complete this task.',
      cause: GAME_NOT_IN_WISHLIST_ERROR
    });
  }
};
