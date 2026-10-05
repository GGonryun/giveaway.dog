import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSteamWishlist } from '../steam';
import {
  GAME_NOT_IN_WISHLIST_ERROR,
  PRIVATE_STEAM_WISHLIST_ERROR
} from '@giveaway/task-model/steam-errors';
import { SteamWishlistTaskSchema } from '@giveaway/task-model/schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  IDS,
  db,
  jsonResponse,
  textResponse
} from '@giveaway/testing-server/fixtures-task-validation';
import { applicationError } from '@giveaway/util-errors/testing/application-error';

const fetchMock = vi.fn<typeof fetch>();

const STEAM_ID = '76561198000000000';

const OWNERSHIP_URL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=steam-secret&steamid=${STEAM_ID}&appids_filter=%5B730%5D&format=json`;

const WISHLIST_URL = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${STEAM_ID}`;

const buildTask = (
  appId = 'https://store.steampowered.com/app/730/CounterStrike_2/'
): SteamWishlistTaskSchema => ({
  ...BASE_TASK,
  id: 'task-steam',
  type: 'STEAM_WISHLIST',
  appId
});

const input = (task = buildTask()) => ({
  task,
  userId: IDS.userId,
  participantId: IDS.participantId,
  teamId: IDS.teamId
});

const steamAccount = {
  userId: IDS.userId,
  type: 'oauth',
  provider: 'steam',
  providerAccountId: STEAM_ID
};

const notOwned = () => jsonResponse({ response: { game_count: 0 } });

describe('checkSteamWishlist', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('STEAM_SECRET', 'steam-secret');
    fetchMock.mockReset();
    prismaMock.account.findFirst.mockResolvedValue(steamAccount);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('Steam account lookup', () => {
    it('looks up the steam account of the user', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { games: [{ appid: 730 }] } })
      );

      await checkSteamWishlist(db, input());

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { userId: IDS.userId, provider: 'steam' }
      });
    });

    it('rejects with VALIDATION_ERROR when no Steam account is connected', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await applicationError(checkSteamWishlist(db, input()));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message:
          'You must connect your Steam account before completing this task.'
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('rejects with VALIDATION_ERROR when the app URL has no app id', async () => {
    const error = await applicationError(
      checkSteamWishlist(
        db,
        input(buildTask('https://store.steampowered.com/developer/valve'))
      )
    );

    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Steam App URL provided.'
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('when the user owns the game', () => {
    it('resolves after only checking ownership', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { games: [{ appid: 730 }] } })
      );

      await expect(checkSteamWishlist(db, input())).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(OWNERSHIP_URL);
    });

    it('puts an undefined key in the ownership URL when STEAM_SECRET is unset', async () => {
      vi.stubEnv('STEAM_SECRET', undefined);
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { games: [{ appid: 730 }] } })
      );

      await checkSteamWishlist(db, input());

      expect(fetchMock).toHaveBeenCalledWith(
        OWNERSHIP_URL.replace('key=steam-secret', 'key=undefined')
      );
    });
  });

  describe('when ownership cannot be confirmed', () => {
    it.each([
      ['the ownership request fails', () => textResponse('forbidden', 403)],
      ['the library is private', () => jsonResponse({ response: {} })],
      ['the response is empty', () => jsonResponse(null)],
      [
        'the game is not in the library',
        () => jsonResponse({ response: { games: [] } })
      ]
    ])('falls back to the wishlist when %s', async (_label, ownership) => {
      fetchMock
        .mockResolvedValueOnce(ownership())
        .mockResolvedValueOnce(
          jsonResponse({ response: { items: [{ appid: 730 }] } })
        );

      await expect(checkSteamWishlist(db, input())).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenNthCalledWith(2, WISHLIST_URL);
    });
  });

  describe('wishlist verification', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValueOnce(notOwned());
    });

    it('resolves when the wishlist contains the app among other items', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { items: [{ appid: 10 }, { appid: 730 }] } })
      );

      await expect(checkSteamWishlist(db, input())).resolves.toBeUndefined();
    });

    it('rejects with INTERNAL_SERVER_ERROR when the wishlist request fails', async () => {
      fetchMock.mockResolvedValueOnce(textResponse('steam down', 500));

      const error = await applicationError(checkSteamWishlist(db, input()));

      expect(error).toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify Steam wishlist.',
        cause: 'steam down'
      });
    });

    it('rejects with a silent VALIDATION_ERROR when the wishlist is private', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ response: {} }));

      const error = await applicationError(checkSteamWishlist(db, input()));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message:
          'Please ensure in your Steam profile privacy settings that you have "My profile" and "Game details" set to public',
        cause: PRIVATE_STEAM_WISHLIST_ERROR,
        silent: true
      });
    });

    it('rejects with VALIDATION_ERROR when the game is not wishlisted', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { items: [{ appid: 570 }] } })
      );

      const error = await applicationError(checkSteamWishlist(db, input()));

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message:
          'The specified game must be in your Steam wishlist or library to complete this task.',
        cause: GAME_NOT_IN_WISHLIST_ERROR,
        silent: false
      });
    });

    it('treats an empty wishlist as not containing the game', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ response: { items: [] } })
      );

      const error = await applicationError(checkSteamWishlist(db, input()));

      expect(error.cause).toBe(GAME_NOT_IN_WISHLIST_ERROR);
    });
  });
});
