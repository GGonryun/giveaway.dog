import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@giveaway/db-model';
import {
  assertProperty,
  randomSeed,
  seededRandom
} from '@giveaway/testing-server/property';
import { buildAllocation } from '@giveaway/winners-model/testing/fixtures-winners-model';
import {
  toDuplicatePrizeDraw,
  toUniquePrizeDraw,
  type PrizeDrawProps
} from '../selection';
import { buildExpandedCompletion } from '../testing/fixtures-sweepstakes-winners-email';

const USER_IDS = Array.from({ length: 6 }, (_, i) => `user-${i}`);

const PRIZE_IDS = ['prize-0', 'prize-1', 'prize-2'];

const participantOf = (userId: string) => `participant-${userId}`;

const drawScenario = fc
  .record({
    entries: fc.array(
      fc.record({
        userId: fc.constantFrom(...USER_IDS),
        value: fc.integer({ min: 1, max: 10 })
      }),
      { maxLength: 15 }
    ),
    slots: fc.array(fc.constantFrom(...PRIZE_IDS), { maxLength: 8 }),
    drawnUserIds: fc.subarray(USER_IDS),
    allocations: fc.subarray(
      USER_IDS.flatMap((userId) =>
        PRIZE_IDS.map((prizeId) => ({ userId, prizeId }))
      )
    ),
    allowUserSelection: fc.boolean(),
    seed: randomSeed
  })
  .map(
    ({
      entries,
      slots,
      drawnUserIds,
      allocations,
      allowUserSelection,
      seed
    }): { seed: number; props: PrizeDrawProps } => ({
      seed,
      props: {
        slots: slots.map((prizeId) => ({ prizeId })),
        draws: drawnUserIds.map((userId, i) => ({
          drawId: `draw-${i}`,
          userId
        })),
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 0,
          allowMultipleWins: false,
          allowUserSelection,
          externalPlatforms: null
        },
        completions: entries.map(({ userId, value }, i) =>
          buildExpandedCompletion({ id: `completion-${i}`, userId, value })
        ),
        allocations: allocations.map(({ userId, prizeId }) =>
          buildAllocation(participantOf(userId), prizeId)
        )
      }
    })
  );

const DRAW_FUNCTIONS = [
  ['toUniquePrizeDraw', toUniquePrizeDraw],
  ['toDuplicatePrizeDraw', toDuplicatePrizeDraw]
] as const;

const runDraw = (
  draw: (props: PrizeDrawProps) => Prisma.PrizeDrawCreateManyInput[],
  { seed, props }: { seed: number; props: PrizeDrawProps }
) => {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
  return draw(props);
};

const winnerOf = (
  props: PrizeDrawProps,
  draw: Prisma.PrizeDrawCreateManyInput
) => {
  const completion = props.completions.find(
    ({ id }) => id === draw.taskCompletionId
  );
  if (!completion) {
    throw new Error(`Unknown task completion ${draw.taskCompletionId}`);
  }
  return completion;
};

const countBy = <T>(values: T[]) => {
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
};

const hasAllocation = (
  props: PrizeDrawProps,
  participantId: string,
  prizeId: string
) =>
  props.allocations.some(
    (allocation) =>
      allocation.participantId === participantId &&
      allocation.prizeId === prizeId
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('prize draw properties', () => {
  it('[DRAW-002] toUniquePrizeDraw never picks the same user twice', () => {
    assertProperty(
      fc.property(drawScenario, (scenario) => {
        const userIds = runDraw(toUniquePrizeDraw, scenario).map(
          (draw) => winnerOf(scenario.props, draw).participant.userId
        );

        expect(new Set(userIds).size).toBe(userIds.length);
      })
    );
  });

  it('[DRAW-003] toUniquePrizeDraw never picks a user who already has a draw', () => {
    assertProperty(
      fc.property(drawScenario, (scenario) => {
        const drawnUserIds = scenario.props.draws.map(({ userId }) => userId);

        for (const draw of runDraw(toUniquePrizeDraw, scenario)) {
          expect(drawnUserIds).not.toContain(
            winnerOf(scenario.props, draw).participant.userId
          );
        }
      })
    );
  });

  describe.each(DRAW_FUNCTIONS)('%s', (_, drawFunction) => {
    it('[DRAW-004] never returns more winners for a prize than it has empty slots', () => {
      assertProperty(
        fc.property(drawScenario, (scenario) => {
          const draws = runDraw(drawFunction, scenario);
          const slotsByPrize = countBy(
            scenario.props.slots.map(({ prizeId }) => prizeId)
          );

          for (const [prizeId, count] of countBy(
            draws.map(({ prizeId }) => prizeId)
          )) {
            expect(count).toBeLessThanOrEqual(slotsByPrize.get(prizeId) ?? 0);
          }
        })
      );
    });

    it('[DRAW-005] every winner is one of the eligible completions', () => {
      assertProperty(
        fc.property(drawScenario, (scenario) => {
          for (const draw of runDraw(drawFunction, scenario)) {
            expect(draw.result).toBe('WINNER');
            expect(() => winnerOf(scenario.props, draw)).not.toThrow();
          }
        })
      );
    });

    it('[DRAW-009] with user selection, every winner has an allocation for the prize they won', () => {
      assertProperty(
        fc.property(drawScenario, ({ seed, props }) => {
          const withSelection = {
            ...props,
            criteria: { ...props.criteria, allowUserSelection: true }
          };

          for (const draw of runDraw(drawFunction, {
            seed,
            props: withSelection
          })) {
            const winner = winnerOf(withSelection, draw);
            expect(
              hasAllocation(withSelection, winner.participant.id, draw.prizeId)
            ).toBe(true);
          }
        })
      );
    });
  });

  it('[DRAW-010] toDuplicatePrizeDraw fills every slot that has an eligible completion', () => {
    assertProperty(
      fc.property(drawScenario, (scenario) => {
        const { props } = scenario;
        const fillableSlots = props.slots.filter(({ prizeId }) =>
          props.completions.some(
            (completion) =>
              !props.criteria.allowUserSelection ||
              hasAllocation(props, completion.participant.id, prizeId)
          )
        );

        expect(runDraw(toDuplicatePrizeDraw, scenario)).toHaveLength(
          fillableSlots.length
        );
      })
    );
  });
});
