import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateApiCalls, estimateDuration } from '../calculate-api-calls';

describe('calculateApiCalls', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the coverage target needs fewer than the minimum calls', () => {
    it.each([0, 1, 199, 200])(
      'uses the minimum of 3 calls for %i retweets',
      (retweetCount) => {
        expect(calculateApiCalls(retweetCount)).toBe(3);
      }
    );
  });

  describe('when the coverage target is between the limits', () => {
    it.each([
      [201, 4],
      [333, 5],
      [334, 6],
      [400, 6],
      [600, 9],
      [666, 10]
    ])('uses %i retweets to compute %i calls', (retweetCount, expected) => {
      expect(calculateApiCalls(retweetCount)).toBe(expected);
    });
  });

  describe('when the coverage target exceeds the maximum calls', () => {
    it.each([667, 1000, 1_000_000])(
      'caps %i retweets at 10 calls',
      (retweetCount) => {
        expect(calculateApiCalls(retweetCount)).toBe(10);
      }
    );
  });

  describe('when the retweet count is invalid', () => {
    it('uses the minimum calls for a negative count', () => {
      expect(calculateApiCalls(-50)).toBe(3);
    });

    it('returns NaN for a NaN count', () => {
      expect(calculateApiCalls(Number.NaN)).toBeNaN();
    });
  });

  it('logs the calculation inputs and result', () => {
    calculateApiCalls(201);

    expect(console.info).toHaveBeenCalledWith(
      'Calculated API calls: retweetCount=201, targetUsers=60, minCallsForCoverage=4, finalCount=4'
    );
  });
});

describe('estimateDuration', () => {
  it.each([
    [0, 0],
    [1, 1000],
    [3, 3000],
    [10, 10000]
  ])('estimates %i calls take %i ms', (apiCalls, expected) => {
    expect(estimateDuration(apiCalls)).toBe(expected);
  });
});
