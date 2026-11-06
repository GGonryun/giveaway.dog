import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '@giveaway/testing-server/property';
import { normalizeQualityScoreRange } from '../quality-score-range';

const bound = fc.option(fc.integer({ min: -1000, max: 1000 }), {
  nil: undefined
});

describe('normalizeQualityScoreRange properties', () => {
  it('never returns a minimum above the maximum or a score outside 0 to 100', () => {
    assertProperty(
      fc.property(bound, bound, (minQualityScore, maxQualityScore) => {
        const range = normalizeQualityScoreRange({
          minQualityScore,
          maxQualityScore
        });

        [range.minQualityScore, range.maxQualityScore].forEach((score) => {
          if (score === undefined) return;
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
        if (
          range.minQualityScore !== undefined &&
          range.maxQualityScore !== undefined
        ) {
          expect(range.minQualityScore).toBeLessThanOrEqual(
            range.maxQualityScore
          );
        }
        expect(range.minQualityScore === undefined).toBe(
          minQualityScore === undefined
        );
        expect(range.maxQualityScore === undefined).toBe(
          maxQualityScore === undefined
        );
      })
    );
  });

  it('leaves a range that is already in order and in bounds unchanged', () => {
    assertProperty(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (a, b) => {
          const range = {
            minQualityScore: Math.min(a, b),
            maxQualityScore: Math.max(a, b)
          };

          expect(normalizeQualityScoreRange(range)).toEqual(range);
        }
      )
    );
  });

  it('gives the same range whichever order the bounds are given in', () => {
    assertProperty(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        (a, b) => {
          expect(
            normalizeQualityScoreRange({
              minQualityScore: a,
              maxQualityScore: b
            })
          ).toEqual(
            normalizeQualityScoreRange({
              minQualityScore: b,
              maxQualityScore: a
            })
          );
        }
      )
    );
  });
});
