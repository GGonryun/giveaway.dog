'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import {
  ParticipantSweepstakeSchema,
  TimeSeriesDataSchema
} from '@/schemas/giveaway/schemas';
import { BarChart3, Gift, Users } from 'lucide-react';
import { DEFAULT_TIME_SERIES_DURATION } from '@/lib/settings';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  entries: {
    label: 'Total Entries',
    color: 'var(--color-chart-1)'
  }
};

export const SweepstakesAnalytics: React.FC<
  ParticipantSweepstakeSchema & { timeseries: TimeSeriesDataSchema[] }
> = ({ participation, timeseries }) => {
  // Calculate trend
  const totalEntries = participation?.totalEntries || 0;
  const totalUniqueUsers = participation?.totalUsers || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Entries Timeline</CardTitle>
        <CardDescription>
          Total entry volume over the last {DEFAULT_TIME_SERIES_DURATION} days
        </CardDescription>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6 pt-2">
          <div className="text-sm text-muted-foreground">
            Total Entries:{' '}
            <span className="font-medium">{totalEntries.toLocaleString()}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>Unique Users: </span>
            <span className="font-medium">
              {totalUniqueUsers.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={timeseries}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              width={25}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
            />
            <ChartTooltip
              content={ChartTooltipContent}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="entries"
              stroke="var(--color-chart-1)"
              fill="var(--color-chart-1)"
              fillOpacity={0.3}
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
