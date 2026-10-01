import { describe, it, expect } from 'vitest';
import * as platformScoring from '../platform-scoring';
import * as scoringSchemas from '@/lib/scoring/schemas';

describe('schemas/platform-scoring', () => {
  it('re-exports the lib/scoring/schemas barrel unchanged', () => {
    expect(Object.keys(platformScoring).sort()).toEqual(
      Object.keys(scoringSchemas).sort()
    );
    for (const [name, value] of Object.entries(scoringSchemas)) {
      expect(platformScoring).toHaveProperty(name, value);
    }
  });

  it('exposes both the imported and signup scoring exports', () => {
    expect(platformScoring.IMPORTED_BASE_SCORE).toBe(50);
    expect(platformScoring.USER_BASE_SCORE).toBe(30);
    expect(typeof platformScoring.toUserQuality).toBe('function');
  });
});
