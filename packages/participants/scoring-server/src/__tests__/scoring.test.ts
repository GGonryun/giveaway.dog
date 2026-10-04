import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { computeUserQualityScore } from '../scoring';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const USER_ID = 'user-1';
const NEUTRAL_SIGNUP_SCORE = 55;
const IMPORTED_SCORE = 50;

const arrangeUser = (source: UserSource | string) => {
  prismaMock.user.findUnique.mockResolvedValue({
    id: USER_ID,
    source,
    createdAt: NOW,
    emailVerified: null,
    accounts: []
  });
  prismaMock.taskCompletion.findMany.mockResolvedValue([]);
  prismaMock.userIpAddress.findMany.mockResolvedValue([]);
  prismaMock.userFingerprint.findMany.mockResolvedValue([]);
  prismaMock.userTurnstile.findUnique.mockResolvedValue(null);
};

describe('computeUserQualityScore', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('looks up the user source by id', async () => {
    arrangeUser(UserSource.SIGNUP);

    await computeUserQualityScore(asPrismaClient(), USER_ID);

    expect(prismaMock.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: USER_ID },
      select: { id: true, source: true, createdAt: true }
    });
  });

  describe('when the user does not exist', () => {
    it('does nothing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await computeUserQualityScore(asPrismaClient(), USER_ID);

      expect(result).toBeUndefined();
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.userQuality.create).not.toHaveBeenCalled();
    });
  });

  describe.each([
    UserSource.SIGNUP,
    UserSource.ANONYMOUS,
    UserSource.MANUAL_IMPORT
  ])('when the user source is %s', (source) => {
    it('computes a signal-based signup score', async () => {
      arrangeUser(source);

      await computeUserQualityScore(asPrismaClient(), USER_ID);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.userQuality.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, score: NEUTRAL_SIGNUP_SCORE }
      });
    });
  });

  describe.each([
    UserSource.DISCORD_IMPORT,
    UserSource.TWITTER_IMPORT,
    UserSource.BLUESKY_IMPORT,
    UserSource.TWITCH_IMPORT
  ])('when the user source is %s', (source) => {
    it('assigns the fixed imported base score without loading signals', async () => {
      arrangeUser(source);

      await computeUserQualityScore(asPrismaClient(), USER_ID);

      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
      expect(prismaMock.userQuality.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, score: IMPORTED_SCORE }
      });
    });
  });

  describe('when the user source is unrecognised', () => {
    it('throws an unexpected value error and writes nothing', async () => {
      arrangeUser('SCRAPED');

      await expect(
        computeUserQualityScore(asPrismaClient(), USER_ID)
      ).rejects.toThrow('Unexpected value: SCRAPED');
      expect(prismaMock.userQuality.create).not.toHaveBeenCalled();
    });
  });
});
