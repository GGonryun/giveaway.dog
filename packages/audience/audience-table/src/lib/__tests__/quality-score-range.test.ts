import { describe, expect, it } from 'vitest';
import { normalizeQualityScoreRange } from '../quality-score-range';

describe('normalizeQualityScoreRange', () => {
  it('keeps a range in order', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 20, maxQualityScore: 80 })
    ).toEqual({ minQualityScore: 20, maxQualityScore: 80 });
  });

  it('keeps a range whose bounds are equal', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 50, maxQualityScore: 50 })
    ).toEqual({ minQualityScore: 50, maxQualityScore: 50 });
  });

  it('swaps a minimum above the maximum', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 80, maxQualityScore: 20 })
    ).toEqual({ minQualityScore: 20, maxQualityScore: 80 });
  });

  it('swaps bounds that are one apart', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 51, maxQualityScore: 50 })
    ).toEqual({ minQualityScore: 50, maxQualityScore: 51 });
  });

  it('clamps scores below 0 and above 100', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: -5, maxQualityScore: 150 })
    ).toEqual({ minQualityScore: 0, maxQualityScore: 100 });
  });

  it('keeps 0 and 100', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 0, maxQualityScore: 100 })
    ).toEqual({ minQualityScore: 0, maxQualityScore: 100 });
  });

  it('clamps before it compares the bounds', () => {
    expect(
      normalizeQualityScoreRange({ minQualityScore: 150, maxQualityScore: -5 })
    ).toEqual({ minQualityScore: 0, maxQualityScore: 100 });
  });

  it.each([
    [{ minQualityScore: 150 }, { minQualityScore: 100 }],
    [{ maxQualityScore: -5 }, { maxQualityScore: 0 }],
    [{ minQualityScore: 90 }, { minQualityScore: 90 }],
    [{ maxQualityScore: 10 }, { maxQualityScore: 10 }]
  ])('normalizes a single bound %j without the other', (input, expected) => {
    expect(normalizeQualityScoreRange(input)).toEqual({
      minQualityScore: undefined,
      maxQualityScore: undefined,
      ...expected
    });
  });

  it('drops a bound that is not a number', () => {
    expect(
      normalizeQualityScoreRange({
        minQualityScore: Number.NaN,
        maxQualityScore: Number.NaN
      })
    ).toEqual({ minQualityScore: undefined, maxQualityScore: undefined });
  });
});
