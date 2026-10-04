import { describe, it, expect } from 'vitest';
import { allocationStatisticsSchema } from '../schemas';

const allocation = (overrides: Record<string, unknown> = {}) => ({
  prizeId: 'p-1',
  prizeName: 'Gift Card',
  allocationCount: 3,
  badge: 'none',
  ...overrides
});

describe('allocationStatisticsSchema', () => {
  describe('when the data is valid', () => {
    it('accepts statistics with no allocations', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: 0,
        allocationsByPrize: []
      });

      expect(result.success).toBe(true);
    });

    it.each(['popular', 'unpopular', 'none'])(
      'accepts the %s badge',
      (badge) => {
        const result = allocationStatisticsSchema.safeParse({
          totalAllocations: 3,
          allocationsByPrize: [allocation({ badge })]
        });

        expect(result.success).toBe(true);
      }
    );

    it('returns the parsed data unchanged', () => {
      const input = {
        totalAllocations: 3,
        allocationsByPrize: [allocation()]
      };

      expect(allocationStatisticsSchema.parse(input)).toEqual(input);
    });

    it('strips unknown keys from allocation entries', () => {
      const parsed = allocationStatisticsSchema.parse({
        totalAllocations: 3,
        allocationsByPrize: [allocation({ extra: true })]
      });

      expect(parsed.allocationsByPrize[0]).not.toHaveProperty('extra');
    });

    it('accepts negative and fractional counts because numbers are unconstrained', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: -1.5,
        allocationsByPrize: [allocation({ allocationCount: 0.5 })]
      });

      expect(result.success).toBe(true);
    });
  });

  describe('when the data is invalid', () => {
    it('rejects an unknown badge', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: 3,
        allocationsByPrize: [allocation({ badge: 'trending' })]
      });

      expect(result.success).toBe(false);
    });

    it('rejects a missing totalAllocations', () => {
      const result = allocationStatisticsSchema.safeParse({
        allocationsByPrize: []
      });

      expect(result.success).toBe(false);
    });

    it('rejects a string totalAllocations', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: '3',
        allocationsByPrize: []
      });

      expect(result.success).toBe(false);
    });

    it('rejects a null prizeName', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: 3,
        allocationsByPrize: [allocation({ prizeName: null })]
      });

      expect(result.success).toBe(false);
    });

    it('rejects a missing prizeId', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: 3,
        allocationsByPrize: [allocation({ prizeId: undefined })]
      });

      expect(result.success).toBe(false);
    });

    it('rejects a non array allocationsByPrize', () => {
      const result = allocationStatisticsSchema.safeParse({
        totalAllocations: 3,
        allocationsByPrize: allocation()
      });

      expect(result.success).toBe(false);
    });
  });
});
