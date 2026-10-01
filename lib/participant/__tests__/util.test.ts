import { describe, it, expect } from 'vitest';
import { toEngagementTheme, toQualityTheme } from '../util';

describe.each([
  ['toEngagementTheme', toEngagementTheme],
  ['toQualityTheme', toQualityTheme]
])('%s', (_name, toTheme) => {
  it.each([
    [100, 'bg-green-500'],
    [80, 'bg-green-500'],
    [79.9, 'bg-blue-500'],
    [60, 'bg-blue-500'],
    [59, 'bg-yellow-500'],
    [40, 'bg-yellow-500'],
    [39, 'bg-red-500'],
    [0, 'bg-red-500'],
    [-5, 'bg-red-500']
  ])('maps %s to %s', (score, theme) => {
    expect(toTheme(score)).toBe(theme);
  });

  it('maps NaN to the lowest theme', () => {
    expect(toTheme(Number.NaN)).toBe('bg-red-500');
  });
});
