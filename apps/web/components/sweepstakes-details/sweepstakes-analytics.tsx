'use client';

import React from 'react';
import {
  ParticipantSweepstakeSchema,
  TimeSeriesDataSchema
} from '@/schemas/giveaway/schemas';
import { DailyEntriesTimeline } from './daily-entries-timeline';
import { AllocationStatisticsSchema } from '@giveaway/allocation-model/schemas';
import { PrizeAllocationChart } from './prize-allocation-chart';

export const SweepstakesAnalytics: React.FC<
  ParticipantSweepstakeSchema & {
    timeseries: TimeSeriesDataSchema[];
    allocations: AllocationStatisticsSchema;
  }
> = (props) => {
  const { sweepstakes, allocations } = props;
  const allowUserSelection = sweepstakes.criteria.allowUserSelection;

  if (allowUserSelection) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DailyEntriesTimeline {...props} />
        <PrizeAllocationChart allocations={allocations} />
      </div>
    );
  }

  return <DailyEntriesTimeline {...props} />;
};
