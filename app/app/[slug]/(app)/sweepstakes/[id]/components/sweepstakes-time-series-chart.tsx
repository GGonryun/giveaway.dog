'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import {} from '@/components/ui/badge';
import { BarChart3, Users, Gift } from 'lucide-react';
import { useSweepstakesDetailsContext } from './use-sweepstakes-details-context';
import {
  DEFAULT_TIME_SERIES_DURATION,
  SWEEPSTAKES_TIME_SERIES_REFRESH_INTERVAL
} from '@/lib/settings';
import { secondsToHours } from 'date-fns';
import pluralize from 'pluralize';

const chartConfig = {
  entries: {
    label: 'Total Entries',
    color: 'var(--color-chart-1)'
  }
};

export const SweepstakesTimeSeriesChart = () => {
  const { participation, timeSeries } = useSweepstakesDetailsContext();

  // Calculate trend
  const totalEntries = participation?.totalEntries || 0;
  const totalUniqueUsers = participation?.totalUsers || 0;

  const refreshUnit = secondsToHours(SWEEPSTAKES_TIME_SERIES_REFRESH_INTERVAL);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Daily Entries Timeline</span>
            </CardTitle>
            <CardDescription>
              Total entry volume over the last {DEFAULT_TIME_SERIES_DURATION}{' '}
              days
            </CardDescription>
            <CardDescription>
              Refreshes every {refreshUnit} {pluralize('hour', refreshUnit)}
            </CardDescription>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6 pt-2">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>Total Entries: </span>
            <span className="font-medium">{totalEntries.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
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
            data={timeSeries}
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
