import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAllocations,
  buildCriteria,
  buildGiveawayPrize,
  buildHost,
  buildParticipation,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { DailyEntriesTimeline } from '../daily-entries-timeline';
import { PrizeAllocationChart } from '../prize-allocation-chart';
import { SweepstakesAnalytics } from '../sweepstakes-analytics';

vi.mock('../daily-entries-timeline', () => ({
  DailyEntriesTimeline: vi.fn(() => <div>daily entries timeline</div>)
}));

vi.mock('../prize-allocation-chart', () => ({
  PrizeAllocationChart: vi.fn(() => <div>prize allocation chart</div>)
}));

const timeseries = [
  { date: '2026-09-30', entries: 4 },
  { date: '2026-10-01', entries: 9 }
];
const allocations = buildAllocations();

const renderAnalytics = (allowUserSelection: boolean) => {
  const props = {
    sweepstakes: buildSweepstakes({
      criteria: buildCriteria({ allowUserSelection })
    }),
    host: buildHost(),
    prizes: [buildGiveawayPrize()],
    participation: buildParticipation(),
    timeseries,
    allocations
  };
  const result = render(<SweepstakesAnalytics {...props} />);
  return { ...result, props };
};

describe('SweepstakesAnalytics', () => {
  beforeEach(() => {
    vi.mocked(DailyEntriesTimeline).mockClear();
    vi.mocked(PrizeAllocationChart).mockClear();
  });

  it('only shows the timeline when participants cannot pick a prize', () => {
    const { container, props } = renderAnalytics(false);
    expect(screen.getByText('daily entries timeline')).toBeInTheDocument();
    expect(
      screen.queryByText('prize allocation chart')
    ).not.toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass('grid');
    expect(vi.mocked(DailyEntriesTimeline).mock.lastCall?.[0]).toEqual(props);
  });

  it('shows the timeline next to the allocation chart when participants pick a prize', () => {
    const { container } = renderAnalytics(true);
    expect(screen.getByText('daily entries timeline')).toBeInTheDocument();
    expect(screen.getByText('prize allocation chart')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('grid', 'xl:grid-cols-2');
    expect(vi.mocked(PrizeAllocationChart).mock.lastCall?.[0]).toEqual({
      allocations
    });
  });
});
