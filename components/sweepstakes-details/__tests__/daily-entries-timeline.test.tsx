import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildGiveawayPrize,
  buildHost,
  buildParticipation,
  buildSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import type {
  GiveawayParticipationSchema,
  TimeSeriesDataSchema
} from '@/schemas/giveaway/schemas';
import { DailyEntriesTimeline } from '../daily-entries-timeline';

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

const renderTimeline = (
  timeseries: TimeSeriesDataSchema[],
  participation: GiveawayParticipationSchema = buildParticipation()
) =>
  render(
    <DailyEntriesTimeline
      sweepstakes={buildSweepstakes()}
      host={buildHost()}
      prizes={[buildGiveawayPrize()]}
      participation={participation}
      timeseries={timeseries}
    />
  );

const tickLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('.recharts-cartesian-axis-tick-value')
  ).map((tick) => tick.textContent);

describe('DailyEntriesTimeline', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('describes the chart period', () => {
    renderTimeline([]);
    expect(screen.getByText('Daily Entries Timeline')).toBeInTheDocument();
    expect(
      screen.getByText('Total entry volume over the last 7 days')
    ).toBeInTheDocument();
  });

  it('shows the total entries and unique users with digit grouping', () => {
    renderTimeline(
      [],
      buildParticipation({ totalEntries: 12345, totalUsers: 2048 })
    );
    expect(screen.getByText('Total Entries:')).toHaveTextContent(
      `Total Entries: ${(12345).toLocaleString()}`
    );
    expect(screen.getByText((2048).toLocaleString())).toBeInTheDocument();
  });

  it('shows zero totals for an empty giveaway', () => {
    renderTimeline([], buildParticipation({ totalEntries: 0, totalUsers: 0 }));
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('labels the days with a short month and day', () => {
    const { container } = renderTimeline([
      { date: '2026-09-30', entries: 4 },
      { date: '2026-10-01', entries: 9 }
    ]);
    expect(tickLabels(container).slice(0, 2)).toEqual(['Sep 30', 'Oct 1']);
  });

  it('shows the previous day for time zones west of UTC', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const { container } = renderTimeline([
      { date: '2026-09-30', entries: 4 },
      { date: '2026-10-01', entries: 9 }
    ]);
    expect(tickLabels(container).slice(0, 2)).toEqual(['Sep 29', 'Sep 30']);
  });

  it('abbreviates thousands on the entries axis', () => {
    const { container } = renderTimeline([
      { date: '2026-09-30', entries: 1200 },
      { date: '2026-10-01', entries: 2500 }
    ]);
    expect(tickLabels(container).slice(2)).toEqual([
      '0',
      '650',
      '1k',
      '2k',
      '3k'
    ]);
  });
});
