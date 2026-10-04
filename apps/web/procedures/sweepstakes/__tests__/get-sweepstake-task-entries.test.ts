import { describe, it, expect, beforeEach } from 'vitest';
import getSweepstakeTaskEntries from '../get-sweepstake-task-entries';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { USER_SCHEMA_SELECT_QUERY } from '@giveaway/user-model/user';
import {
  buildTaskRecord,
  buildTeam,
  buildUserRecord,
  expectedBonusTask,
  expectedUserSchema,
  SWEEPSTAKES_ID
} from './fixtures-procedures-sweepstakes-a';

const input = { sweepstakesId: SWEEPSTAKES_ID, taskId: 'task-1' };

const sweepstakes = (overrides: Record<string, unknown> = {}) => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: 'team-1',
  team: buildTeam(),
  ...overrides
});

const completion = (
  id: string,
  completedAt: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  participantId: `participant-${id}`,
  taskId: 'task-1',
  completedAt: new Date(completedAt),
  proof: null,
  reason: null,
  status: 'COMPLETED',
  participant: { user: buildUserRecord() },
  task: buildTaskRecord(),
  ...overrides
});

describe('getSweepstakeTaskEntries', () => {
  describe('when the input is invalid', () => {
    it('rejects a missing task id', async () => {
      const result = await getSweepstakeTaskEntries({
        sweepstakesId: SWEEPSTAKES_ID
      } as unknown as Parameters<typeof getSweepstakeTaskEntries>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes cannot be found', () => {
    it('looks up the sweepstakes by id only', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await getSweepstakeTaskEntries(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID },
        include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND naming the id when nothing matches', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakes({ team: null })
      );

      const result = await getSweepstakeTaskEntries(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.taskCompletion.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes exists', () => {
    beforeEach(() => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes());
    });

    it('loads completions by task id without scoping them to the sweepstakes', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      await getSweepstakeTaskEntries(input);

      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        include: {
          participant: {
            select: { user: { select: USER_SCHEMA_SELECT_QUERY } }
          },
          task: true
        }
      });
    });

    it('returns an empty list when the task has no completions', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([]);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectOk(result)).toEqual([]);
    });

    it('maps a completion into an entry and keeps the raw completion fields', async () => {
      const raw = completion('c-1', '2026-09-01T10:00:00.000Z', {
        proof: { answer: 'yes' },
        status: 'PENDING'
      });
      prismaMock.taskCompletion.findMany.mockResolvedValue([raw]);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectOk(result)).toEqual([
        {
          id: 'c-1',
          participantId: 'participant-c-1',
          taskId: 'task-1',
          status: 'PENDING',
          reason: null,
          participant: raw.participant,
          user: expectedUserSchema(),
          completedAt: Date.parse('2026-09-01T10:00:00.000Z'),
          proof: { answer: 'yes' },
          task: expectedBonusTask('task-1')
        }
      ]);
    });

    it('keeps the database order instead of sorting by completion time', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('old', '2026-09-01T00:00:00.000Z'),
        completion('newest', '2026-09-03T00:00:00.000Z'),
        completion('middle', '2026-09-02T00:00:00.000Z')
      ]);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectOk(result).map((entry) => entry.id)).toEqual([
        'old',
        'newest',
        'middle'
      ]);
    });

    it('turns a non-object proof into an empty object', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', { proof: [1, 2] })
      ]);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectOk(result)[0].proof).toEqual({});
    });

    it('returns INTERNAL_SERVER_ERROR when the task config cannot be parsed', async () => {
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        completion('c-1', '2026-09-01T00:00:00.000Z', {
          task: buildTaskRecord({ config: null })
        })
      ]);

      const result = await getSweepstakeTaskEntries(input);

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to parse task config'
      );
    });
  });
});
