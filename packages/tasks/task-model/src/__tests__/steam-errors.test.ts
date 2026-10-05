import { describe, it, expect } from 'vitest';
import {
  GAME_NOT_IN_WISHLIST_ERROR,
  GAME_NOT_OWNED_ERROR,
  PRIVATE_STEAM_LIBRARY_ERROR,
  PRIVATE_STEAM_WISHLIST_ERROR
} from '../steam-errors';

describe('steam error constants', () => {
  it('exposes stable error identifiers', () => {
    expect({
      PRIVATE_STEAM_WISHLIST_ERROR,
      GAME_NOT_IN_WISHLIST_ERROR,
      PRIVATE_STEAM_LIBRARY_ERROR,
      GAME_NOT_OWNED_ERROR
    }).toEqual({
      PRIVATE_STEAM_WISHLIST_ERROR: 'PRIVATE_STEAM_WISHLIST',
      GAME_NOT_IN_WISHLIST_ERROR: 'GAME_NOT_IN_WISHLIST',
      PRIVATE_STEAM_LIBRARY_ERROR: 'PRIVATE_STEAM_LIBRARY',
      GAME_NOT_OWNED_ERROR: 'GAME_NOT_OWNED'
    });
  });
});
