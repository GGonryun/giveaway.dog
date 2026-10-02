import { describe, it, expect } from 'vitest';
import {
  ENFORCEMENT_LEVELS,
  VALID_ENFORCEMENT_VALUES,
  clampToNearestEnforcementLevel,
  getEnforcementLevel
} from '../enforcement-levels';

describe('enforcement levels', () => {
  describe('ENFORCEMENT_LEVELS', () => {
    it('defines a level for every valid enforcement value', () => {
      expect(Object.keys(ENFORCEMENT_LEVELS).map(Number)).toEqual([
        ...VALID_ENFORCEMENT_VALUES
      ]);
    });

    it('labels each level', () => {
      expect(
        VALID_ENFORCEMENT_VALUES.map((value) => ({
          value,
          label: ENFORCEMENT_LEVELS[value].label
        }))
      ).toEqual([
        { value: 0, label: 'None' },
        { value: 25, label: 'Minimum' },
        { value: 50, label: 'Moderate' },
        { value: 75, label: 'Maximum' }
      ]);
    });

    it('describes each level with a message', () => {
      expect(ENFORCEMENT_LEVELS[0].message).toBe(
        'This might allow bots, cheaters, and spammers to participate in your giveaway.'
      );
      expect(ENFORCEMENT_LEVELS[25].message).toBe(
        'This might allow some suspicious users but offers some protection against the worst offenders.'
      );
      expect(ENFORCEMENT_LEVELS[50].message).toBe(
        'Most bad actors will be filtered out. This provides a decent middle ground between protection and engagement.'
      );
      expect(ENFORCEMENT_LEVELS[75].message).toBe(
        'This offers maximum protection and might reduce engagement, but will guarantee that bots, cheaters, and spammers are not allowed to participate.'
      );
    });
  });

  describe('VALID_ENFORCEMENT_VALUES', () => {
    it('lists 0, 25, 50 and 75', () => {
      expect(VALID_ENFORCEMENT_VALUES).toEqual([0, 25, 50, 75]);
    });
  });

  describe('clampToNearestEnforcementLevel', () => {
    it.each([
      [0, 0],
      [25, 25],
      [50, 50],
      [75, 75],
      [10, 0],
      [13, 25],
      [37, 25],
      [38, 50],
      [62, 50],
      [63, 75],
      [100, 75],
      [-50, 0]
    ])('clamps %s to %s', (value, expected) => {
      expect(clampToNearestEnforcementLevel(value)).toBe(expected);
    });

    it.each([
      [12.5, 0],
      [37.5, 25],
      [62.5, 50]
    ])('keeps the lower level on an exact tie at %s', (value, expected) => {
      expect(clampToNearestEnforcementLevel(value)).toBe(expected);
    });

    it.each([Infinity, -Infinity])(
      'returns 0 for %s because every distance is infinite',
      (value) => {
        expect(clampToNearestEnforcementLevel(value)).toBe(0);
      }
    );

    it('returns 0 for NaN', () => {
      expect(clampToNearestEnforcementLevel(NaN)).toBe(0);
    });
  });

  describe('getEnforcementLevel', () => {
    it('returns the level for an exact value', () => {
      expect(getEnforcementLevel(50)).toBe(ENFORCEMENT_LEVELS[50]);
    });

    it('returns the nearest level for an intermediate value', () => {
      expect(getEnforcementLevel(70)).toBe(ENFORCEMENT_LEVELS[75]);
    });

    it('returns the None level for NaN', () => {
      expect(getEnforcementLevel(NaN)).toBe(ENFORCEMENT_LEVELS[0]);
    });

    it('returns the Maximum level for values above the range', () => {
      expect(getEnforcementLevel(1000).label).toBe('Maximum');
    });
  });
});
