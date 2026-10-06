import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { assertProperty } from '@giveaway/testing-server/property';
import { isEligibleTaskCompletion } from '../completions';
import { buildCompletion } from '../testing/fixtures-sweepstakes-winners-email';

type EligibilityCriteria = Parameters<
  typeof isEligibleTaskCompletion
>[0]['criteria'];

type Participant = {
  qualityScore: number;
  source: UserSource;
  taskCount: number;
};

const SOURCES = Object.values(UserSource);

const participantArb = fc.record({
  qualityScore: fc.integer({ min: 0, max: 100 }),
  source: fc.constantFrom(...SOURCES),
  taskCount: fc.integer({ min: 0, max: 10 })
});

const criteriaArb = fc.record({
  minQualityScore: fc.integer({ min: 0, max: 100 }),
  minTasksCompleted: fc.integer({ min: 0, max: 10 }),
  allowUserSelection: fc.boolean(),
  externalPlatforms: fc.option(fc.subarray(SOURCES), { nil: null })
});

const isEligible = (participant: Participant, criteria: EligibilityCriteria) =>
  isEligibleTaskCompletion({
    userCompletionCounts: new Map([['user-a', participant.taskCount]]),
    criteria
  })(
    buildCompletion({
      userId: 'user-a',
      qualityScore: participant.qualityScore,
      source: participant.source
    })
  );

const hasPlatformFilter = (criteria: EligibilityCriteria) =>
  criteria.externalPlatforms !== null && criteria.externalPlatforms.length > 0;

const relaxedCriteriaArb = (criteria: EligibilityCriteria) =>
  fc
    .record({
      qualityDrop: fc.integer({ min: 0, max: 100 }),
      tasksDrop: fc.integer({ min: 0, max: 10 }),
      extraSources: fc.subarray(SOURCES),
      dropPlatformFilter: fc.boolean()
    })
    .map(
      ({
        qualityDrop,
        tasksDrop,
        extraSources,
        dropPlatformFilter
      }): EligibilityCriteria => ({
        ...criteria,
        minQualityScore: Math.max(0, criteria.minQualityScore - qualityDrop),
        minTasksCompleted: Math.max(0, criteria.minTasksCompleted - tasksDrop),
        externalPlatforms:
          !hasPlatformFilter(criteria) || dropPlatformFilter
            ? null
            : [
                ...new Set([
                  ...(criteria.externalPlatforms ?? []),
                  ...extraSources
                ])
              ]
      })
    );

describe('eligibility properties', () => {
  it('[ELIG-001] a participant below the minimum quality score is not eligible', () => {
    assertProperty(
      fc.property(
        participantArb,
        criteriaArb,
        fc.integer({ min: 1, max: 50 }),
        (participant, criteria, gap) => {
          expect(
            isEligible(participant, {
              ...criteria,
              minQualityScore: participant.qualityScore + gap
            })
          ).toBe(false);
        }
      )
    );
  });

  it('[ELIG-002] a participant below the minimum number of completed tasks is not eligible', () => {
    assertProperty(
      fc.property(
        participantArb,
        criteriaArb,
        fc.integer({ min: 1, max: 10 }),
        (participant, criteria, gap) => {
          expect(
            isEligible(participant, {
              ...criteria,
              minTasksCompleted: participant.taskCount + gap
            })
          ).toBe(false);
        }
      )
    );
  });

  it('[ELIG-003] a participant from a source outside the allowed external platforms is not eligible', () => {
    assertProperty(
      fc.property(
        participantArb.chain((participant) =>
          fc.tuple(
            fc.constant(participant),
            fc.subarray(
              SOURCES.filter((source) => source !== participant.source),
              { minLength: 1 }
            )
          )
        ),
        criteriaArb,
        ([participant, externalPlatforms], criteria) => {
          expect(
            isEligible(participant, { ...criteria, externalPlatforms })
          ).toBe(false);
        }
      )
    );
  });

  it('[ELIG-004] relaxing a criterion never removes an eligible participant', () => {
    assertProperty(
      fc.property(
        participantArb,
        criteriaArb.chain((criteria) =>
          fc.tuple(fc.constant(criteria), relaxedCriteriaArb(criteria))
        ),
        (participant, [criteria, relaxed]) => {
          if (isEligible(participant, criteria)) {
            expect(isEligible(participant, relaxed)).toBe(true);
          }
        }
      )
    );
  });

  it('[ELIG-005] a participant who meets every criterion is eligible', () => {
    assertProperty(
      fc.property(
        participantArb,
        criteriaArb,
        fc.subarray(SOURCES),
        (participant, criteria, otherSources) => {
          const met: EligibilityCriteria = {
            ...criteria,
            minQualityScore: Math.min(
              criteria.minQualityScore,
              participant.qualityScore
            ),
            minTasksCompleted: Math.min(
              criteria.minTasksCompleted,
              participant.taskCount
            ),
            externalPlatforms:
              criteria.externalPlatforms === null
                ? null
                : [...new Set([...otherSources, participant.source])]
          };

          expect(isEligible(participant, met)).toBe(true);
        }
      )
    );
  });
});
