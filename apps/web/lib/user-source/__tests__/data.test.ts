import { describe, it, expect } from 'vitest';
import { UserSource } from '@prisma/client';
import { USER_SOURCE_LABEL } from '../data';

describe('USER_SOURCE_LABEL', () => {
  it('labels every user source', () => {
    expect(USER_SOURCE_LABEL).toEqual({
      SIGNUP: 'Verified Users',
      TWITTER_IMPORT: 'X Import',
      BLUESKY_IMPORT: 'Bluesky Import',
      MANUAL_IMPORT: 'Manual Import',
      DISCORD_IMPORT: 'Discord Import',
      TWITCH_IMPORT: 'Twitch Import',
      ANONYMOUS: 'Anonymous Users'
    });
  });

  it('covers every UserSource enum value', () => {
    expect(Object.keys(USER_SOURCE_LABEL).sort()).toEqual(
      Object.values(UserSource).sort()
    );
  });

  it('uses unique labels', () => {
    const labels = Object.values(USER_SOURCE_LABEL);

    expect(new Set(labels).size).toBe(labels.length);
  });
});
