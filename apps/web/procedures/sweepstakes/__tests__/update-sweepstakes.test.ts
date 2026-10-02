import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SweepstakesStatus, TeamRole } from '@prisma/client';
import updateSweepstakes from '../update-sweepstakes';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes,
  stubSweepstakesRewrite
} from './fixtures-procedures-sweepstakes-b';

type Input = Parameters<typeof updateSweepstakes>[0];

const START = new Date('2025-06-20T00:00:00.000Z');
const END = new Date('2025-06-30T00:00:00.000Z');

describe('updateSweepstakes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    stubSweepstakesRewrite(prismaMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without touching the database', async () => {
      const result = await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without an id', async () => {
      const result = await updateSweepstakes({
        setup: { name: 'x' }
      } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"Invalid input"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non object payload', async () => {
      const result = await updateSweepstakes('sweep-1' as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"Invalid input"/
      );
    });
  });

  describe('when the input is valid', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns the team slug', async () => {
      const result = await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
    });

    it('keeps the stored status when the input has none', async () => {
      await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SweepstakesStatus.DRAFT })
        })
      );
    });

    it('applies a status smuggled in the input payload', async () => {
      await updateSweepstakes({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.ACTIVE
      } as unknown as Input);

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SweepstakesStatus.ACTIVE })
        })
      );
    });

    it('stores the submitted details', async () => {
      await updateSweepstakes({
        id: SWEEPSTAKES_ID,
        setup: { name: 'Renamed' }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: {
              create: {
                name: 'Renamed',
                description: undefined,
                banner: undefined
              }
            }
          })
        })
      );
    });

    it('does not schedule jobs for an active sweepstakes when no status is sent', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status: SweepstakesStatus.ACTIVE })
      );

      await updateSweepstakes({
        id: SWEEPSTAKES_ID,
        timing: { startDate: START, endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('stores the description and custom terms without unsafe markup', async () => {
      await updateSweepstakes({
        id: SWEEPSTAKES_ID,
        setup: {
          name: 'Bike',
          description:
            '<p>Win</p><img src="x" onerror="alert(document.domain)">'
        },
        terms: {
          type: 'CUSTOM',
          text: '<p>Rules</p><script>alert(1)</script>'
        }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: {
              create: {
                name: 'Bike',
                description: '<p>Win</p>',
                banner: undefined
              }
            },
            terms: { create: { type: 'CUSTOM', text: '<p>Rules</p>' } }
          })
        })
      );
    });

    it('invalidates the sweepstakes cache tag', async () => {
      await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(nextCacheMock.revalidateTag).toHaveBeenCalledTimes(1);
      expect(nextCacheMock.revalidateTag).toHaveBeenCalledWith(
        `sweepstakes-${SWEEPSTAKES_ID}`,
        'max'
      );
    });
  });

  describe('when the sweepstakes cannot be changed', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns NOT_FOUND when the sweepstakes is missing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a guest member', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      const result = await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expectFailure(result, 'FORBIDDEN');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a completed sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status: SweepstakesStatus.COMPLETED })
      );

      const result = await updateSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Completed sweepstakes cannot be modified.'
      );
    });
  });
});
