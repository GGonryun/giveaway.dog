import { describe, expect, it } from 'vitest';
import { toSweepstakesJobScope, toTaskJobScope } from '../scope';

describe('job scope', () => {
  describe('toSweepstakesJobScope', () => {
    it('adds no filter without a giveaway', () => {
      expect(toSweepstakesJobScope()).toEqual({});
      expect(toSweepstakesJobScope({})).toEqual({});
    });

    it('filters the jobs of one giveaway', () => {
      expect(toSweepstakesJobScope({ sweepstakesId: 'sweep-1' })).toEqual({
        sweepstakesId: 'sweep-1'
      });
    });

    it('keeps an empty id as a filter that matches no giveaway', () => {
      expect(toSweepstakesJobScope({ sweepstakesId: '' })).toEqual({
        sweepstakesId: ''
      });
    });
  });

  describe('toTaskJobScope', () => {
    it('adds no filter without a giveaway', () => {
      expect(toTaskJobScope()).toEqual({});
      expect(toTaskJobScope({})).toEqual({});
    });

    it('filters the task jobs through the giveaway of their task', () => {
      expect(toTaskJobScope({ sweepstakesId: 'sweep-1' })).toEqual({
        task: { sweepstakesId: 'sweep-1' }
      });
    });
  });
});
