import { describe, it, expect, beforeEach } from 'vitest';
import { getPublishedSweepstakes } from '../get-published-sweepstakes';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  buildTeam,
  TEAM_ID,
  TEAM_SLUG
} from './fixtures-procedures-sweepstakes-a';

describe('getPublishedSweepstakes', () => {
  describe('when the input is invalid', () => {
    it('rejects a missing slug', async () => {
      const result = await getPublishedSweepstakes(
        {} as unknown as Parameters<typeof getPublishedSweepstakes>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the team does not exist', () => {
    beforeEach(() => {
      prismaMock.team.findUnique.mockResolvedValue(null);
    });

    it('looks the team up by slug', async () => {
      await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: TEAM_SLUG }
      });
    });

    it('returns NOT_FOUND naming the slug', async () => {
      const result = await getPublishedSweepstakes({ slug: 'ghost-team' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Team with slug ghost-team not found'
      );
    });

    it('does not count sweepstakes', async () => {
      await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(prismaMock.sweepstakes.count).not.toHaveBeenCalled();
    });
  });

  describe('when the team exists', () => {
    beforeEach(() => {
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    it('counts only active and completed sweepstakes of the team', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(4);

      await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(prismaMock.sweepstakes.count).toHaveBeenCalledWith({
        where: {
          teamId: TEAM_ID,
          status: { in: ['COMPLETED', 'ACTIVE'] }
        }
      });
    });

    it('returns the count to anonymous visitors', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(4);

      const result = await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(expectOk(result)).toEqual({ count: 4 });
    });

    it('returns the count to signed in users', async () => {
      signIn();
      prismaMock.sweepstakes.count.mockResolvedValue(2);

      const result = await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(expectOk(result)).toEqual({ count: 2 });
    });

    it('returns zero when the team has nothing published', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(0);

      const result = await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(expectOk(result)).toEqual({ count: 0 });
    });

    it('fails output validation when the count is not a number', async () => {
      prismaMock.sweepstakes.count.mockResolvedValue(null);

      const result = await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });

  describe('when the database fails', () => {
    it('maps a P2025 error to NOT_FOUND', async () => {
      prismaMock.team.findUnique.mockRejectedValue(knownRequestError('P2025'));

      const result = await getPublishedSweepstakes({ slug: TEAM_SLUG });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(prismaMock.sweepstakes.count).not.toHaveBeenCalled();
    });
  });
});
