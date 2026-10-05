import { render, screen } from '@testing-library/react';
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

const legendItems = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll(
      '.recharts-legend-wrapper .flex.items-center.gap-2'
    )
  );

describe('PrizeAllocationChart', () => {
  describe('without allocations', () => {
    const empty = buildAllocations({
      totalAllocations: 0,
      allocationsByPrize: []
    });

    it('explains that nobody picked a prize yet', () => {
      const { container } = render(
        <PrizeAllocationChart allocations={empty} />
      );
      expect(screen.getByText('No Allocations Yet')).toBeInTheDocument();
      expect(
        screen.getByText("Users haven't selected their prize preferences yet")
      ).toBeInTheDocument();
      expect(container.querySelector('[data-slot="chart"]')).toBeNull();
    });
  });

  describe('with allocations', () => {
    it('shows the total number of selections', () => {
      render(<PrizeAllocationChart allocations={buildAllocations()} />);
      expect(
        screen.getByText('Prize Allocation Distribution')
      ).toBeInTheDocument();
      expect(screen.getByText('Total Selections:')).toHaveTextContent(
        'Total Selections: 4'
      );
      expect(screen.queryByText('No Allocations Yet')).not.toBeInTheDocument();
    });

    it('lists every prize with its share of the selections in the legend', () => {
      const { container } = render(
        <PrizeAllocationChart allocations={buildAllocations()} />
      );
      expect(legendItems(container).map((item) => item.textContent)).toEqual([
        'Gaming Headset: 75%',
        'Gift Card: 25%'
      ]);
    });

    it('rounds the legend shares to whole percents', () => {
      const { container } = render(
        <PrizeAllocationChart
          allocations={{
            totalAllocations: 3,
            allocationsByPrize: ['A', 'B', 'C'].map((name) => ({
              prizeId: `prize-${name}`,
              prizeName: `Prize ${name}`,
              allocationCount: 1,
              badge: 'none' as const
            }))
          }}
        />
      );
      expect(legendItems(container).map((item) => item.textContent)).toEqual([
        'Prize A: 33%',
        'Prize B: 33%',
        'Prize C: 33%'
      ]);
    });

    it('cycles through the five chart colors', () => {
      const { container } = render(
        <PrizeAllocationChart
          allocations={{
            totalAllocations: 6,
            allocationsByPrize: Array.from({ length: 6 }, (_, index) => ({
              prizeId: `prize-${index}`,
              prizeName: `Prize ${index}`,
              allocationCount: 1,
              badge: 'none' as const
            }))
          }}
        />
      );
      const swatches = legendItems(container).map(
        (item) => (item.firstElementChild as HTMLElement).style.backgroundColor
      );
      expect(swatches).toEqual([
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)',
        'var(--color-chart-1)'
      ]);
    });
  });
});
