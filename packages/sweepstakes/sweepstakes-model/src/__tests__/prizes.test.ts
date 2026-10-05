import { describe, it, expect } from 'vitest';
import type { Prisma } from '@giveaway/db-model';
import { PRIZE_WINNERS_INCLUDE_QUERY, toSweepstakesPrizes } from '../prizes';
import {
  USER_SCHEMA_SELECT_QUERY,
  toUserSchema
} from '@giveaway/user-model/user';
import { TASK_COMPLETIONS_SELECT_QUERY } from '@giveaway/task-model/completions';
import { ApplicationError } from '@giveaway/util-errors';
import {
  buildUserPayload,
  FIXED_CREATED_AT
} from '@giveaway/user-model/testing/fixtures-schemas-core-and-scoring';

type PrizePayload = Prisma.PrizeGetPayload<{
  include: typeof PRIZE_WINNERS_INCLUDE_QUERY;
}>;
type DrawPayload = PrizePayload['draws'][number];

const DRAWN_AT = new Date('2026-02-01T12:00:00.000Z');
const COMPLETED_AT = new Date('2026-01-20T08:30:00.000Z');

const buildDraw = (overrides: Partial<DrawPayload> = {}): DrawPayload => ({
  id: 'draw-1',
  prizeId: 'prize-1',
  taskCompletionId: 'completion-1',
  result: 'WINNER',
  disqualificationReason: null,
  previousDrawId: null,
  createdAt: DRAWN_AT,
  updatedAt: DRAWN_AT,
  taskCompletion: {
    id: 'completion-1',
    completedAt: COMPLETED_AT,
    proof: { url: 'https://example.com/proof' },
    status: 'COMPLETED',
    task: {
      id: 'task-1',
      sweepstakesId: 'sweep-1',
      index: 0,
      config: {
        type: 'BONUS_TASK',
        title: 'Say hi',
        value: 2,
        mandatory: false,
        tasksRequired: 0
      },
      sweepstakes: { details: { name: 'Summer Giveaway' } }
    },
    participant: {
      id: 'participant-1',
      userId: 'user-1',
      sweepstakesId: 'sweep-1',
      createdAt: FIXED_CREATED_AT,
      updatedAt: FIXED_CREATED_AT,
      user: buildUserPayload()
    }
  },
  ...overrides
});

const buildPrize = (overrides: Partial<PrizePayload> = {}): PrizePayload => ({
  id: 'prize-1',
  sweepstakesId: 'sweep-1',
  name: 'Gift Card',
  index: 1,
  quota: 3,
  draws: [],
  ...overrides
});

const captureError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('PRIZE_WINNERS_INCLUDE_QUERY', () => {
  it('includes each draw with its task completion and participant user', () => {
    expect(PRIZE_WINNERS_INCLUDE_QUERY).toEqual({
      draws: {
        include: {
          taskCompletion: {
            select: {
              ...TASK_COMPLETIONS_SELECT_QUERY,
              participant: {
                include: { user: { select: USER_SCHEMA_SELECT_QUERY } }
              }
            }
          }
        }
      }
    });
  });
});

describe('toSweepstakesPrizes', () => {
  describe('when every prize is valid', () => {
    it('returns an empty list for no prizes', () => {
      expect(toSweepstakesPrizes([])).toEqual([]);
    });

    it('maps a prize without draws', () => {
      expect(toSweepstakesPrizes([buildPrize()])).toEqual([
        {
          id: 'prize-1',
          name: 'Gift Card',
          position: 1,
          quota: 3,
          draws: []
        }
      ]);
    });

    it('uses the prize index as its position, including index 0', () => {
      const [prize] = toSweepstakesPrizes([buildPrize({ index: 0 })]);

      expect(prize.position).toBe(0);
    });

    it('maps each draw with its task completion and participant', () => {
      const draw = buildDraw();

      const [prize] = toSweepstakesPrizes([buildPrize({ draws: [draw] })]);

      expect(prize.draws).toEqual([
        {
          id: 'draw-1',
          createdAt: DRAWN_AT,
          updatedAt: DRAWN_AT,
          result: 'WINNER',
          disqualificationReason: null,
          taskCompletion: {
            id: 'completion-1',
            completedAt: COMPLETED_AT,
            status: 'COMPLETED',
            proof: { url: 'https://example.com/proof' },
            task: {
              id: 'task-1',
              type: 'BONUS_TASK',
              title: 'Say hi',
              value: 2,
              mandatory: false,
              tasksRequired: 0
            },
            sweepstake: { id: 'sweep-1', name: 'Summer Giveaway' }
          },
          participant: toUserSchema(buildUserPayload())
        }
      ]);
    });

    it('keeps the disqualification result and reason', () => {
      const draw = buildDraw({
        result: 'DISQUALIFIED',
        disqualificationReason: 'Duplicate account'
      });

      const [prize] = toSweepstakesPrizes([buildPrize({ draws: [draw] })]);

      expect(prize.draws[0]).toMatchObject({
        result: 'DISQUALIFIED',
        disqualificationReason: 'Duplicate account'
      });
    });

    it('preserves the order of prizes and draws', () => {
      const result = toSweepstakesPrizes([
        buildPrize({
          id: 'prize-a',
          draws: [buildDraw({ id: 'draw-a1' }), buildDraw({ id: 'draw-a2' })]
        }),
        buildPrize({ id: 'prize-b', index: 2 })
      ]);

      expect(result.map((prize) => prize.id)).toEqual(['prize-a', 'prize-b']);
      expect(result[0].draws.map((draw) => draw.id)).toEqual([
        'draw-a1',
        'draw-a2'
      ]);
    });
  });

  describe('when a prize is invalid', () => {
    it.each([null, 0])('rejects a quota of %j', (quota) => {
      const error = captureError(() =>
        toSweepstakesPrizes([buildPrize({ id: 'prize-q', quota })])
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Prize with ID prize-q has invalid quota'
      });
    });

    it.each([null, ''])('rejects a name of %j', (name) => {
      const error = captureError(() =>
        toSweepstakesPrizes([buildPrize({ id: 'prize-n', name })])
      );

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Prize with ID prize-n has no name'
      });
    });

    it.each([null, undefined])('rejects an index of %j', (index) => {
      const error = captureError(() =>
        toSweepstakesPrizes([
          buildPrize({ id: 'prize-i', index: index as number | null })
        ])
      );

      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Prize with ID prize-i has no index'
      });
    });

    it('checks the quota before the name and index', () => {
      const error = captureError(() =>
        toSweepstakesPrizes([
          buildPrize({ id: 'prize-x', quota: null, name: null, index: null })
        ])
      );

      expect(error).toMatchObject({
        message: 'Prize with ID prize-x has invalid quota'
      });
    });

    it('checks the name before the index', () => {
      const error = captureError(() =>
        toSweepstakesPrizes([
          buildPrize({ id: 'prize-x', name: null, index: null })
        ])
      );

      expect(error).toMatchObject({
        message: 'Prize with ID prize-x has no name'
      });
    });

    it('fails the whole list when a later prize is invalid', () => {
      const error = captureError(() =>
        toSweepstakesPrizes([
          buildPrize({ id: 'ok' }),
          buildPrize({ id: 'broken', quota: null })
        ])
      );

      expect(error).toMatchObject({
        message: 'Prize with ID broken has invalid quota'
      });
    });
  });
});
