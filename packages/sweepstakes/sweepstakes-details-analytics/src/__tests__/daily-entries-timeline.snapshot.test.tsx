import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildGiveawayPrize,
  buildHost,
  buildParticipation,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import type {
  GiveawayParticipationSchema,
  TimeSeriesDataSchema
} from '@giveaway/sweepstakes-model/schemas';
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

describe('DailyEntriesTimeline', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('matches the snapshot of the header', () => {
    const { container } = renderTimeline([]);
    expect(
      container.querySelector('[data-slot="card-header"]')
    ).toMatchSnapshot();
  });
});
