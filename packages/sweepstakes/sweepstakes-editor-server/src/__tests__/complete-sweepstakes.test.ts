import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PrizeDrawResult,
  SweepstakesJobStatus,
  SweepstakesJobType,
  TeamRole
} from '@giveaway/db-model';
import completeSweepstakes from '../complete-sweepstakes';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import {
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';

const { requestJobRun } = vi.hoisted(() => ({ requestJobRun: vi.fn() }));

vi.mock('@giveaway/jobs/schedule', () => ({ requestJobRun }));

const NOW = new Date('2026-10-01T12:00:00.000Z');

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const prize = (id: string, quota: number | null, winners: number) => ({
  id,
  sweepstakesId: SWEEPSTAKES_ID,
  name: `Prize ${id}`,
  index: 0,
  quota,
  draws: Array.from({ length: winners }, (_, i) => ({
    id: `${id}-draw-${i}`,
    result: PrizeDrawResult.WINNER
  }))
});

const sweepstakesWithPrizes = (
  prizes: ReturnType<typeof prize>[],
  role: TeamRole = TeamRole.MEMBER
) => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: 'team-1',
  team: { members: [{ userId: TEST_USER.id, role }] },
  prizes
});

describe('completeSweepstakes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying the database', async () => {
      const result = await completeSweepstakes(input);

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

    it('rejects a missing slug', async () => {
      const result = await completeSweepstakes({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof completeSweepstakes>[0]);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non-string sweepstakes id', async () => {
      const result = await completeSweepstakes({
        sweepstakesId: 42,
        slug: TEAM_SLUG
      } as unknown as Parameters<typeof completeSweepstakes>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the sweepstakes cannot be found', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);
    });

    it('returns NOT_FOUND', async () => {
      const result = await completeSweepstakes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes not found'
      );
    });

    it('scopes the lookup to the team slug and the caller membership and loads winning draws', async () => {
      await completeSweepstakes(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: SWEEPSTAKES_ID,
          team: {
            slug: TEAM_SLUG,
            members: { some: { userId: TEST_USER.id } }
          }
        },
        include: {
          team: {
            select: {
              members: {
                where: { userId: TEST_USER.id },
                select: { userId: true, role: true }
              }
            }
          },
          prizes: {
            include: {
              draws: { where: { result: PrizeDrawResult.WINNER } }
            }
          }
        }
      });
    });

    it('does not start a transaction', async () => {
      await completeSweepstakes(input);

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
    });
  });

  describe('when the caller cannot update giveaways of the team', () => {
    beforeEach(() => {
      signIn();
    });

    it.each([TeamRole.GUEST, TeamRole.BLOCKED])(
      '[ROLE-007] returns FORBIDDEN and changes nothing for a %s',
      async (role) => {
        prismaMock.sweepstakes.findUnique.mockResolvedValue(
          sweepstakesWithPrizes([prize('p-1', 1, 1)], role)
        );

        const result = await completeSweepstakes(input);

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
        );
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
        expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
      }
    );
  });

  describe('when the sweepstakes has no team', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns FORBIDDEN and changes nothing', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...sweepstakesWithPrizes([]),
        teamId: null,
        team: null
      });

      const result = await completeSweepstakes(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'You are not a member of this team'
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when not every prize slot has a winner', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns VALIDATION_ERROR when a single prize is short of winners', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', 2, 1)])
      );

      const result = await completeSweepstakes(input);

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Cannot complete sweepstakes: not all winners have been selected'
      );
    });

    it('sums quotas and winners across every prize', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', 1, 1), prize('p-2', 2, 1)])
      );

      const result = await completeSweepstakes(input);

      expectFailure(result, 'VALIDATION_ERROR');
    });

    it('does not update the sweepstakes or schedule a job', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', 1, 0)])
      );

      await completeSweepstakes(input);

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.update).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when every prize slot has a winner', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', 1, 1), prize('p-2', 2, 2)])
      );
    });

    it('returns success', async () => {
      const result = await completeSweepstakes(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('marks the sweepstakes as COMPLETED inside a transaction', async () => {
      await completeSweepstakes(input);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID },
        data: { status: 'COMPLETED' }
      });
    });

    it('upserts a pending PROCESS_COMPLETION job that runs now', async () => {
      await completeSweepstakes(input);

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith({
        where: {
          sweepstakesId_type: {
            sweepstakesId: SWEEPSTAKES_ID,
            type: SweepstakesJobType.PROCESS_COMPLETION
          }
        },
        update: { runAt: NOW },
        create: {
          sweepstakesId: SWEEPSTAKES_ID,
          type: SweepstakesJobType.PROCESS_COMPLETION,
          status: SweepstakesJobStatus.PENDING,
          runAt: NOW
        }
      });
    });

    it('expires the giveaway, the giveaway pages and winners leaderboard cache tags', async () => {
      await completeSweepstakes(input);

      expect(nextCacheMock.revalidateTag.mock.calls).toEqual([
        [`sweepstakes-${SWEEPSTAKES_ID}`, 'max'],
        ['participant-sweepstake', 'max'],
        ['winners-leaderboard', 'max'],
        ['public-sweepstakes-list', 'max'],
        ['historical-sweepstakes-list', 'max'],
        ['browse-hosts', 'max']
      ]);
    });
  });

  describe('when the winner totals hit boundary values', () => {
    beforeEach(() => {
      signIn();
    });

    it('completes a sweepstakes that has no prizes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([])
      );

      const result = await completeSweepstakes(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('treats a null quota as zero slots', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', null, 0)])
      );

      const result = await completeSweepstakes(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('lets extra winners on one prize make up for a missing winner on another', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([prize('p-1', 1, 2), prize('p-2', 2, 1)])
      );

      const result = await completeSweepstakes(input);

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('uses the id of the loaded sweepstakes for the completion job', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({
        ...sweepstakesWithPrizes([]),
        id: 'loaded-id'
      });

      await completeSweepstakes(input);

      expect(prismaMock.sweepstakes.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: SWEEPSTAKES_ID } })
      );
      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sweepstakesId_type: {
              sweepstakesId: 'loaded-id',
              type: SweepstakesJobType.PROCESS_COMPLETION
            }
          }
        })
      );
    });
  });

  describe('requesting a job run', () => {
    beforeEach(() => {
      signIn();
      requestJobRun.mockReset();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([])
      );
    });

    it('requests a job run after the completion job is saved', async () => {
      await completeSweepstakes(input);

      expect(requestJobRun).toHaveBeenCalledOnce();
      expect(requestJobRun.mock.invocationCallOrder[0]).toBeGreaterThan(
        prismaMock.sweepstakesJob.upsert.mock.invocationCallOrder[0]
      );
    });

    it('does not request a job run when the transaction fails', async () => {
      prismaMock.sweepstakesJob.upsert.mockRejectedValue(new Error('down'));

      await completeSweepstakes(input);

      expect(requestJobRun).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakesWithPrizes([])
      );
    });

    it('maps a P2025 error during the update to NOT_FOUND', async () => {
      prismaMock.sweepstakes.update.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await completeSweepstakes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('maps an unexpected error to INTERNAL_SERVER_ERROR with its message', async () => {
      prismaMock.sweepstakesJob.upsert.mockRejectedValue(
        new Error('connection lost')
      );

      const result = await completeSweepstakes(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'connection lost'
      );
    });
  });
});
