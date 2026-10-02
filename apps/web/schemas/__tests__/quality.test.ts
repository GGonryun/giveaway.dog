import { describe, it, expect } from 'vitest';
import {
  qualityTypeSchema,
  QUALITY_THRESHOLDS,
  toQualityType,
  toQualityProgressColor,
  toQualityTextColor,
  QUALITY_THEME,
  QUALITY_BADGE_TEXT,
  QUALITY_BADGE_RISK,
  QUALITY_LABELS,
  QUALITY_DESCRIPTION
} from '../quality';

const QUALITY_TYPES = ['trusted', 'good', 'neutral', 'suspicious', 'banned'];

describe('qualityTypeSchema', () => {
  it.each(QUALITY_TYPES)('accepts %s', (type) => {
    expect(qualityTypeSchema.parse(type)).toBe(type);
  });

  it('rejects an unknown quality', () => {
    expect(qualityTypeSchema.safeParse('excellent').success).toBe(false);
  });
});

describe('QUALITY_THRESHOLDS', () => {
  it('orders thresholds from highest to lowest', () => {
    expect(Object.entries(QUALITY_THRESHOLDS)).toEqual([
      ['trusted', 90],
      ['good', 70],
      ['neutral', 50],
      ['suspicious', 30],
      ['banned', 0]
    ]);
  });
});

describe('toQualityType', () => {
  it.each([
    [100, 'trusted'],
    [90, 'trusted'],
    [89.99, 'good'],
    [70, 'good'],
    [69, 'neutral'],
    [50, 'neutral'],
    [49, 'suspicious'],
    [30, 'suspicious'],
    [29, 'banned'],
    [0, 'banned'],
    [250, 'trusted']
  ])('maps a score of %d to %s', (score, expected) => {
    expect(toQualityType(score)).toBe(expected);
  });

  it('falls back to banned for a negative score', () => {
    expect(toQualityType(-1)).toBe('banned');
  });

  it('falls back to banned for NaN', () => {
    expect(toQualityType(Number.NaN)).toBe('banned');
  });
});

describe('toQualityProgressColor', () => {
  it.each([
    [95, 'bg-green-500 dark:bg-green-800'],
    [75, 'bg-blue-500 dark:bg-blue-800'],
    [55, 'bg-yellow-500 dark:bg-yellow-800'],
    [35, 'bg-orange-500 dark:bg-orange-800'],
    [5, 'bg-red-500 dark:bg-red-800']
  ])('returns the base theme color for a score of %d', (score, expected) => {
    expect(toQualityProgressColor(score)).toBe(expected);
  });
});

describe('toQualityTextColor', () => {
  it.each([
    [95, 'text-green-800 dark:text-green-200'],
    [75, 'text-blue-800 dark:text-blue-200'],
    [55, 'text-yellow-800 dark:text-yellow-200'],
    [35, 'text-orange-800 dark:text-orange-200'],
    [-10, 'text-red-800 dark:text-red-200']
  ])('returns the text theme color for a score of %d', (score, expected) => {
    expect(toQualityTextColor(score)).toBe(expected);
  });
});

describe('quality display records', () => {
  it.each([
    ['QUALITY_THEME', QUALITY_THEME],
    ['QUALITY_BADGE_TEXT', QUALITY_BADGE_TEXT],
    ['QUALITY_BADGE_RISK', QUALITY_BADGE_RISK],
    ['QUALITY_LABELS', QUALITY_LABELS],
    ['QUALITY_DESCRIPTION', QUALITY_DESCRIPTION]
  ])('%s covers every quality type', (_name, record) => {
    expect(Object.keys(record).sort()).toEqual([...QUALITY_TYPES].sort());
  });

  it('defines a full theme for each quality', () => {
    expect(QUALITY_THEME).toEqual({
      trusted: {
        bg: 'bg-green-100 dark:bg-green-800',
        border: 'border-green-700',
        base: 'bg-green-500 dark:bg-green-800',
        text: 'text-green-800 dark:text-green-200'
      },
      good: {
        bg: 'bg-blue-100 dark:bg-blue-800',
        border: 'border-blue-700',
        base: 'bg-blue-500 dark:bg-blue-800',
        text: 'text-blue-800 dark:text-blue-200'
      },
      neutral: {
        bg: 'bg-yellow-100 dark:bg-yellow-800',
        border: 'border-yellow-700',
        base: 'bg-yellow-500 dark:bg-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200'
      },
      suspicious: {
        bg: 'bg-orange-100 dark:bg-orange-800',
        border: 'border-orange-700',
        base: 'bg-orange-500 dark:bg-orange-800',
        text: 'text-orange-800 dark:text-orange-200'
      },
      banned: {
        bg: 'bg-red-100 dark:bg-red-800',
        border: 'border-red-700',
        base: 'bg-red-500 dark:bg-red-800',
        text: 'text-red-800 dark:text-red-200'
      }
    });
  });

  it('labels each quality with the same text for badges and labels', () => {
    expect(QUALITY_BADGE_TEXT).toEqual({
      trusted: 'Trusted',
      good: 'Good',
      neutral: 'Neutral',
      suspicious: 'Suspicious',
      banned: 'Banned'
    });
    expect(QUALITY_LABELS).toEqual(QUALITY_BADGE_TEXT);
  });

  it('maps each quality to a risk level', () => {
    expect(QUALITY_BADGE_RISK).toEqual({
      trusted: 'No Risk',
      good: 'No Risk',
      neutral: 'Low Risk',
      suspicious: 'Medium Risk',
      banned: 'High Risk'
    });
  });

  it('describes each quality', () => {
    expect(QUALITY_DESCRIPTION).toEqual({
      banned: 'This user exhibits bot-like activity. Exercise extreme caution.',
      suspicious:
        'This user has multiple risk factors. Review their activity and details carefully.',
      neutral:
        'This user has no significant risk factors, but also no strong quality indicators. Use your judgment when selecting them as a winner.',
      good: 'This user has low risk factors. They are generally trustworthy.',
      trusted:
        'This user has excellent quality indicators. They are highly trustworthy.'
    });
  });
});
