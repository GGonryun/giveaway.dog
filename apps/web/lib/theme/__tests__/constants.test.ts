import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '../constants';

describe('theme constants', () => {
  it('stores the theme under the giveaway-theme key', () => {
    expect(THEME_STORAGE_KEY).toBe('giveaway-theme');
  });

  it('defaults to the system theme', () => {
    expect(DEFAULT_THEME).toBe('system');
  });
});
