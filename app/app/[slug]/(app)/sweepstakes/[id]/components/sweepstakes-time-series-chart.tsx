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
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, Users, Gift } from 'lucide-react';

interface TimeSeriesData {
  date: string;
  entries: number;
}

interface SweepstakesTimeSeriesChartProps {
  data: TimeSeriesData[];
  totalUniqueUsers: number;
  totalEntries: number;
}

const chartConfig = {
  entries: {
    label: 'Total Entries',
    color: 'var(--color-chart-1)'
  }
};

export const SweepstakesTimeSeriesChart = ({
  data,
  totalUniqueUsers,
  totalEntries
}: SweepstakesTimeSeriesChartProps) => {
  // Calculate trend
  const timeSeriesTotal = data.reduce((sum, day) => sum + day.entries, 0);
  const avgEntries = timeSeriesTotal / data.length;
  const lastEntry = data[data.length - 1]?.entries || 0;
  const trend = lastEntry > avgEntries ? 'up' : 'down';
  const trendPercentage = Math.abs(
    ((lastEntry - avgEntries) / avgEntries) * 100
  ).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Daily Entries Timeline</span>
            </CardTitle>
            <CardDescription>Total entry volume over time</CardDescription>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6 pt-2">
          <div className="flex items-center space-x-2">
            <TrendingUp
              className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
            />
            <Badge
              variant={trend === 'up' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {trend === 'up' ? '+' : '-'}
              {trendPercentage}%
            </Badge>
            <span className="text-sm text-muted-foreground">vs avg</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>Total Entries:{' '}</span>
            <span className="font-medium">{totalEntries.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Unique Users:{' '}</span>
            <span className="font-medium">{totalUniqueUsers.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="overflow-hidden">
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, bottom: 30, left: 0 }}
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
        </div>
      </CardContent>
    </Card>
  );
};
