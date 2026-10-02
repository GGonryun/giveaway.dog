import { describe, it, expect } from 'vitest';
import { StarIcon } from 'lucide-react';
import {
  IMPORTED_BASE_SCORE,
  importedScoreMetricsSchema,
  IMPORTED_METRIC_MAX,
  IMPORTED_METRIC_LABELS,
  IMPORTED_METRIC_ICONS,
  IMPORTED_METRIC_DESCRIPTION,
  IMPORTED_METRIC_TYPE
} from '../imported';

describe('IMPORTED_BASE_SCORE', () => {
  it('is 50', () => {
    expect(IMPORTED_BASE_SCORE).toBe(50);
  });
});

describe('importedScoreMetricsSchema', () => {
  it('accepts a numeric base score', () => {
    expect(importedScoreMetricsSchema.parse({ baseScore: 12 })).toEqual({
      baseScore: 12
    });
  });

  it('strips unknown keys', () => {
    expect(
      importedScoreMetricsSchema.parse({ baseScore: 12, extra: true })
    ).toEqual({ baseScore: 12 });
  });

  it('rejects a missing base score', () => {
    expect(importedScoreMetricsSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a string base score', () => {
    expect(
      importedScoreMetricsSchema.safeParse({ baseScore: '50' }).success
    ).toBe(false);
  });
});

describe('imported metric records', () => {
  it('caps the base score at the imported base score', () => {
    expect(IMPORTED_METRIC_MAX).toEqual({ baseScore: 50 });
  });

  it('labels the base score', () => {
    expect(IMPORTED_METRIC_LABELS).toEqual({ baseScore: 'Base Score' });
  });

  it('uses the star icon for the base score', () => {
    expect(IMPORTED_METRIC_ICONS).toEqual({ baseScore: StarIcon });
  });

  it('describes the base score with the interpolated points', () => {
    expect(IMPORTED_METRIC_DESCRIPTION).toEqual({
      baseScore:
        'The foundational score assigned to all imported users. Imported users receive a neutral base score of +50 points.'
    });
  });

  it('treats the base score as a bonus metric', () => {
    expect(IMPORTED_METRIC_TYPE).toEqual({ baseScore: 'bonus' });
  });
});
