import { describe, it, expect, beforeEach } from 'vitest';
import getSweepstakesPrizes from '../get-sweepstake-prizes';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { PARTICIPANT_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { PRIZE_WINNERS_INCLUDE_QUERY } from '@/schemas/prizes';
import {
  buildTaskRecord,
  buildTeam,
  buildUserRecord,
  expectedBonusTask,
  expectedUserSchema,
  SWEEPSTAKES_ID,
  TEAM_SLUG
} from './fixtures-procedures-sweepstakes-a';

const input = { sweepstakesId: SWEEPSTAKES_ID, slug: TEAM_SLUG };

const CREATED = new Date('2026-09-10T00:00:00.000Z');
const UPDATED = new Date('2026-09-11T00:00:00.000Z');
const COMPLETED = new Date('2026-09-05T00:00:00.000Z');

const sweepstakes = (overrides: Record<string, unknown> = {}) => ({
  id: SWEEPSTAKES_ID,
  status: 'ACTIVE',
  teamId: 'team-1',
  team: buildTeam(),
  ...overrides
});

const draw = (overrides: Record<string, unknown> = {}) => ({
  id: 'draw-1',
  prizeId: 'prize-1',
  taskCompletionId: 'tc-1',
  result: 'WINNER',
  disqualificationReason: null,
  previousDrawId: null,
  createdAt: CREATED,
  updatedAt: UPDATED,
  taskCompletion: {
    id: 'tc-1',
    completedAt: COMPLETED,
    proof: { url: 'https://example.com/proof.png' },
    status: 'COMPLETED',
    task: {
      ...buildTaskRecord(),
      sweepstakes: { details: { name: 'Summer Giveaway' } }
    },
    participant: {
      id: 'participant-1',
      userId: 'entrant-1',
      sweepstakesId: SWEEPSTAKES_ID,
      user: buildUserRecord()
    }
  },
  ...overrides
});

const prize = (overrides: Record<string, unknown> = {}) => ({
  id: 'prize-1',
  sweepstakesId: SWEEPSTAKES_ID,
  name: 'Gold',
  index: 0,
  quota: 1,
  draws: [] as ReturnType<typeof draw>[],
  ...overrides
});

describe('getSweepstakesPrizes', () => {
  describe('when the caller is not authenticated', () => {
    it('returns UNAUTHORIZED without querying the database', async () => {
      const result = await getSweepstakesPrizes(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('rejects a missing sweepstakes id', async () => {
      signIn();

      const result = await getSweepstakesPrizes({
        slug: TEAM_SLUG
      } as unknown as Parameters<typeof getSweepstakesPrizes>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes cannot be found', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the sweepstakes by id and team slug only', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await getSweepstakesPrizes(input);

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID, team: { slug: TEAM_SLUG } },
        include: PARTICIPANT_SWEEPSTAKES_PAYLOAD
      });
    });

    it('returns NOT_FOUND when nothing matches', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      const result = await getSweepstakesPrizes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.prize.findMany).not.toHaveBeenCalled();
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakes({ team: null })
      );

      const result = await getSweepstakesPrizes(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        `Sweepstakes with ID ${SWEEPSTAKES_ID} not found`
      );
      expect(prismaMock.prize.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the sweepstakes exists', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes());
    });

    it('loads the prizes of the requested sweepstakes id with their draws', async () => {
      prismaMock.prize.findMany.mockResolvedValue([]);

      await getSweepstakesPrizes(input);

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID },
        include: PRIZE_WINNERS_INCLUDE_QUERY
      });
    });

    it('loads prizes by the requested id rather than the id of the loaded record', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        sweepstakes({ id: 'loaded-id' })
      );
      prismaMock.prize.findMany.mockResolvedValue([]);

      await getSweepstakesPrizes(input);

      expect(prismaMock.prize.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID },
        include: PRIZE_WINNERS_INCLUDE_QUERY
      });
    });

    it('returns an empty list when there are no prizes', async () => {
      prismaMock.prize.findMany.mockResolvedValue([]);

      const result = await getSweepstakesPrizes(input);

      expect(expectOk(result)).toEqual([]);
    });

    it('maps prizes and their draws', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize({ draws: [draw()] }),
        prize({ id: 'prize-2', name: 'Silver', index: 1, quota: 3 })
      ]);

      const result = await getSweepstakesPrizes(input);

      expect(expectOk(result)).toEqual([
        {
          id: 'prize-1',
          name: 'Gold',
          position: 0,
          quota: 1,
          draws: [
            {
              id: 'draw-1',
              createdAt: CREATED,
              updatedAt: UPDATED,
              result: 'WINNER',
              disqualificationReason: null,
              taskCompletion: {
                id: 'tc-1',
                completedAt: COMPLETED,
                status: 'COMPLETED',
                task: expectedBonusTask('task-1'),
                proof: { url: 'https://example.com/proof.png' },
                sweepstake: { id: SWEEPSTAKES_ID, name: 'Summer Giveaway' }
              },
              participant: expectedUserSchema()
            }
          ]
        },
        { id: 'prize-2', name: 'Silver', position: 1, quota: 3, draws: [] }
      ]);
    });

    it('keeps the disqualification reason of a disqualified draw', async () => {
      prismaMock.prize.findMany.mockResolvedValue([
        prize({
          draws: [
            draw({ result: 'DISQUALIFIED', disqualificationReason: 'Fraud' })
          ]
        })
      ]);

      const result = await getSweepstakesPrizes(input);

      expect(expectOk(result)[0].draws[0]).toMatchObject({
        result: 'DISQUALIFIED',
        disqualificationReason: 'Fraud'
      });
    });

    it('falls back to the default sweepstakes name and an unknown task', async () => {
      const base = draw();
      prismaMock.prize.findMany.mockResolvedValue([
        prize({
          draws: [
            {
              ...base,
              taskCompletion: {
                ...base.taskCompletion,
                task: {
                  ...buildTaskRecord({ config: null }),
                  sweepstakes: { details: null }
                }
              }
            }
          ]
        })
      ]);

      const result = await getSweepstakesPrizes(input);

      expect(expectOk(result)[0].draws[0].taskCompletion).toMatchObject({
        task: {
          type: 'BONUS_TASK',
          id: 'task-1',
          title: 'Unknown Task',
          value: 1,
          mandatory: false,
          tasksRequired: 0
        },
        sweepstake: { id: SWEEPSTAKES_ID, name: 'Untitled Sweepstakes' }
      });
    });

    it.each([
      [
        'a null quota',
        { quota: null },
        'Prize with ID prize-1 has invalid quota'
      ],
      ['a zero quota', { quota: 0 }, 'Prize with ID prize-1 has invalid quota'],
      ['no name', { name: null }, 'Prize with ID prize-1 has no name'],
      ['an empty name', { name: '' }, 'Prize with ID prize-1 has no name'],
      ['no index', { index: null }, 'Prize with ID prize-1 has no index']
    ])(
      'returns VALIDATION_ERROR for a prize with %s',
      async (_, overrides, message) => {
        prismaMock.prize.findMany.mockResolvedValue([prize(overrides)]);

        const result = await getSweepstakesPrizes(input);

        expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(message);
      }
    );
  });
});
