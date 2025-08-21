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
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyEngagementData } from '@/schemas/index';

interface DailyEngagementChartProps {
  data: DailyEngagementData[];
}

const chartConfig = {
  entries: {
    label: 'Entries',
    color: 'var(--color-chart-1)'
  },
  pageviews: {
    label: 'Page Views',
    color: 'var(--color-chart-2)'
  },
  conversionRate: {
    label: 'Conversion Rate (%)',
    color: 'var(--color-chart-3)'
  }
};

export function DailyEngagementChart({ data }: DailyEngagementChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Engagement</CardTitle>
        <CardDescription>
          Entries, page views, and conversion rates over time
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-6">
        <div className="overflow-x-auto overflow-y-hidden">
          <ChartContainer config={chartConfig} className="w-full min-w-0">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric'
                  });
                }}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                height={40}
                hide={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 8 }}
                width={30}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 8 }}
                width={25}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip content={ChartTooltipContent} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="entries"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: 'var(--color-chart-1)',
                  strokeWidth: 2
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pageviews"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: 'var(--color-chart-2)',
                  strokeWidth: 2
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversionRate"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: 'var(--color-chart-3)',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
