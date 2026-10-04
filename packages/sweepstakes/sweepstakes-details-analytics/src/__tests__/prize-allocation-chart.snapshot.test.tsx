import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buildAllocations } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { PrizeAllocationChart } from '../prize-allocation-chart';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <actual.ResponsiveContainer width={800} height={400}>
        {children}
      </actual.ResponsiveContainer>
    )
  };
});

describe('PrizeAllocationChart', () => {
  describe('without allocations', () => {
    const empty = buildAllocations({
      totalAllocations: 0,
      allocationsByPrize: []
    });

    it('matches the snapshot', () => {
      const { container } = render(
        <PrizeAllocationChart allocations={empty} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
