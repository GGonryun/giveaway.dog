import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SweepstakesJobType,
  SweepstakesStatus,
  TeamRole
} from '@prisma/client';
import publishSweepstakes from '../publish-sweepstakes';
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

type Input = Parameters<typeof publishSweepstakes>[0];

const START = new Date('2025-06-20T00:00:00.000Z');
const END = new Date('2025-06-30T00:00:00.000Z');

describe('publishSweepstakes', () => {
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
      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

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
      const result = await publishSweepstakes({} as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"Invalid input"/
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non string id', async () => {
      const result = await publishSweepstakes({ id: 7 } as unknown as Input);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: [\s\S]*"Invalid input"/
      );
    });

    it('rejects a null payload', async () => {
      const result = await publishSweepstakes(null as unknown as Input);

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
      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectOk(result)).toEqual({ slug: TEAM_SLUG });
    });

    it('recreates the sweepstakes with the ACTIVE status', async () => {
      await publishSweepstakes({ id: SWEEPSTAKES_ID });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: SWEEPSTAKES_ID,
            status: SweepstakesStatus.ACTIVE
          })
        })
      );
    });

    it('overrides a status supplied in the input with ACTIVE', async () => {
      await publishSweepstakes({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.DRAFT
      } as unknown as Input);

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SweepstakesStatus.ACTIVE })
        })
      );
    });

    it('schedules the lifecycle jobs from the timing', async () => {
      await publishSweepstakes({
        id: SWEEPSTAKES_ID,
        timing: { startDate: START, endDate: END }
      });

      expect(
        prismaMock.sweepstakesJob.upsert.mock.calls.map(
          ([arg]) => arg.where.sweepstakesId_type.type
        )
      ).toEqual([
        SweepstakesJobType.PROCESS_ACTIVATION,
        SweepstakesJobType.PROCESS_MODIFICATION,
        SweepstakesJobType.PROCESS_EXPIRATION
      ]);
    });

    it('stores the description and custom terms without unsafe markup', async () => {
      await publishSweepstakes({
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
      await publishSweepstakes({ id: SWEEPSTAKES_ID });

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

      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

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

      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

      expectFailure(result, 'FORBIDDEN');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN for a completed sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status: SweepstakesStatus.COMPLETED })
      );

      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Completed sweepstakes cannot be modified.'
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the rewrite fails', async () => {
      prismaMock.sweepstakes.delete.mockRejectedValue(new Error('db down'));

      const result = await publishSweepstakes({ id: SWEEPSTAKES_ID });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db down'
      );
      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
